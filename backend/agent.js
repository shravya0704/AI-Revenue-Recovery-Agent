import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import { executeTool } from "./tools.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

function getHinglishMessage(failureReason, language = "English") {
  const messages = {
    insufficient_funds: {
      English: "Your payment couldn't go through. Please add funds and try again.",
      Hinglish: "Aapka payment fail ho gaya. Kripaya account mein funds add karke dobara try karein."
    },
    card_declined: {
      English: "Your card was declined. Try another payment method.",
      Hinglish: "Aapka card decline ho gaya. Doosra payment method try karein."
    },
    timeout: {
      English: "Network issue. We're retrying your payment now.",
      Hinglish: "Network problem tha. Ab hum aapka payment retry kar rahe hain."
    },
    fraud_block: {
      English: "Your bank blocked this payment for security. Please contact your bank.",
      Hinglish: "Aapke bank ne security ke liye payment block kar diya. Bank se contact karein."
    },
    customer_exit: {
      English: "Did you forget? Complete your checkout now!",
      Hinglish: "Bhool gaye? Ab checkout complete karein aur order place karein!"
    },
    expired_card: {
      English: "Your card has expired. Please update your payment method.",
      Hinglish: "Aapka card expire ho gaya. Naya payment method add karein."
    },
    network_error: {
      English: "Network glitch. Retrying in a moment...",
      Hinglish: "Network mein ek chhoti problem thi. Ab dobara try kar rahe hain..."
    }
  };

  return messages[failureReason]?.[language] || messages[failureReason]?.["English"] || "Payment issue. Please retry.";
}

export async function analyzePayment(paymentData) {
  try {
    const decision = await makeDecisionWithLLM(paymentData);
    return {
      paymentId: paymentData.id,
      agentDecision: decision.action,
      agentReasoning: decision.reasoning,
      rootCause: decision.rootCause,
      recoveryStrategy: decision.recoveryStrategy,
      actionResult: await executeTool(decision.action, decision.params, paymentData),
      lmm_used: true
    };
  } catch (error) {
    console.error("LLM error, falling back to rules:", error.message);
    const decision = makeDecisionWithRules(paymentData);
    return {
      paymentId: paymentData.id,
      agentDecision: decision.action,
      agentReasoning: decision.reasoning,
      rootCause: decision.rootCause,
      recoveryStrategy: decision.recoveryStrategy,
      actionResult: await executeTool(decision.action, decision.params, paymentData),
      llm_used: false,
      fallback_reason: error.message
    };
  }
}

async function makeDecisionWithLLM(paymentData) {
  const { failureReason, customerTier, retryAttempts, checkoutAbandoned } = paymentData;

  const prompt = `You are a payment recovery agent. Analyze this failed payment and decide the recovery action.

Payment Context:
- Failure Reason: ${failureReason}
- Customer Tier: ${customerTier}
- Previous Retries: ${retryAttempts}
- Checkout Abandoned: ${checkoutAbandoned}

Constraints:
- Max 3 retries per customer (stop if retryAttempts >= 3)
- Never retry fraud blocks (escalate instead)
- Fraud blocks need customer verification

Decision Options:
- retry_now: Immediate retry (good for timeouts, network errors)
- retry_after: Schedule retry after 24 hours (good for insufficient funds)
- send_recovery_message: Send SMS/Email reminder (good for cart abandonment)
- escalate_to_human: Send to manual review (good for fraud, expired cards)

Respond ONLY with valid JSON:
{
  "action": "retry_now|retry_after|send_recovery_message|escalate_to_human",
  "reasoning": "Brief explanation of why this action",
  "confidence": 0.0-1.0
}`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 300,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const text = response.choices[0].message.content;
  
  // Extract JSON from response
  let decision;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    decision = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    console.warn("JSON parse failed, using fallback");
    return makeDecisionWithRules(paymentData);
  }

  const language = customerTier === "gold" ? "Hinglish" : "English";
  const rootCause = getRootCauseAnalysis(failureReason);

  return {
    action: decision.action || "escalate_to_human",
    reasoning: decision.reasoning || "LLM decision",
    rootCause: rootCause,
    recoveryStrategy: mapActionToStrategy(decision.action),
    params: mapActionToParams(decision.action, paymentData, language)
  };
}

function makeDecisionWithRules(paymentData) {
  const { failureReason, customerTier, retryAttempts, checkoutAbandoned } = paymentData;
  const language = customerTier === "gold" ? "Hinglish" : "English";
  const rootCause = getRootCauseAnalysis(failureReason);

  if (retryAttempts >= 3) {
    return {
      action: "escalate_to_human",
      params: { reason: "Max retries reached" },
      reasoning: "Customer has been retried 3+ times. Escalating to manual review.",
      rootCause: rootCause,
      recoveryStrategy: "Manual escalation"
    };
  }

  if (checkoutAbandoned) {
    return {
      action: "send_recovery_message",
      params: {
        channel: paymentData.bestChannel,
        message: getHinglishMessage("customer_exit", language),
        language: language
      },
      reasoning: "Customer abandoned checkout. Sending recovery message.",
      rootCause: rootCause,
      recoveryStrategy: "Re-engagement message"
    };
  }

  if (failureReason === "fraud_block") {
    return {
      action: "escalate_to_human",
      params: { reason: "Fraud block detected. Customer verification needed." },
      reasoning: "Fraud block requires customer verification. Escalating.",
      rootCause: rootCause,
      recoveryStrategy: "Escalation + customer verification"
    };
  }

  if (failureReason === "timeout" || failureReason === "network_error") {
    return {
      action: "retry_now",
      params: { reason: "Temporary network issue. Safe to retry immediately." },
      reasoning: "Network timeout detected. Retrying immediately is safe.",
      rootCause: rootCause,
      recoveryStrategy: "Immediate retry"
    };
  }

  if (failureReason === "insufficient_funds") {
    return {
      action: "retry_after",
      params: { hours: 24, reason: "Give customer time to add funds." },
      reasoning: "Insufficient funds. Waiting 24 hours gives customer time to top up.",
      rootCause: rootCause,
      recoveryStrategy: "Delayed retry"
    };
  }

  if (failureReason === "card_declined") {
    return {
      action: "send_recovery_message",
      params: {
        channel: paymentData.bestChannel,
        message: getHinglishMessage("card_declined", language),
        language: language
      },
      reasoning: "Card declined. Notifying customer to use different card.",
      rootCause: rootCause,
      recoveryStrategy: "Customer notification"
    };
  }

  return {
    action: "retry_after",
    params: { hours: 24, reason: "Standard retry protocol." },
    reasoning: "Unknown failure. Scheduling standard retry.",
    rootCause: rootCause,
    recoveryStrategy: "Delayed retry"
  };
}

function getRootCauseAnalysis(failureReason) {
  const causes = {
    insufficient_funds: {
      cause: "Customer Account Issue",
      analysis: "Insufficient balance in customer's account",
      severity: "low",
      recoverable: true
    },
    card_declined: {
      cause: "Card Issue",
      analysis: "Card was declined by issuing bank",
      severity: "medium",
      recoverable: true
    },
    timeout: {
      cause: "Network Issue",
      analysis: "Network timeout - temporary connectivity problem",
      severity: "low",
      recoverable: true
    },
    fraud_block: {
      cause: "Security Block",
      analysis: "Bank's fraud detection flagged transaction",
      severity: "high",
      recoverable: false
    },
    customer_exit: {
      cause: "User Behavior",
      analysis: "Customer intentionally exited checkout",
      severity: "low",
      recoverable: true
    },
    expired_card: {
      cause: "Card Validity",
      analysis: "Card has expired",
      severity: "medium",
      recoverable: true
    },
    network_error: {
      cause: "Network Issue",
      analysis: "Network connectivity error",
      severity: "low",
      recoverable: true
    }
  };
  return causes[failureReason] || { cause: "Unknown", analysis: "Unable to determine", severity: "medium", recoverable: true };
}

function mapActionToStrategy(action) {
  const strategies = {
    retry_now: "Immediate retry",
    retry_after: "Delayed retry (24 hours)",
    send_recovery_message: "Customer notification",
    escalate_to_human: "Manual escalation"
  };
  return strategies[action] || "Standard handling";
}

function mapActionToParams(action, paymentData, language) {
  switch (action) {
    case "retry_now":
      return { reason: "Immediate retry" };
    case "retry_after":
      return { hours: 24, reason: "Scheduled retry" };
    case "send_recovery_message":
      return {
        channel: paymentData.bestChannel,
        message: getHinglishMessage("customer_exit", language),
        language: language
      };
    case "escalate_to_human":
      return { reason: "Manual review required" };
    default:
      return { reason: "Default handling" };
  }
}