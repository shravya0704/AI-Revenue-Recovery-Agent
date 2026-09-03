import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import { executeTool } from "./tools.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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
      analysis: "Card was declined by issuing bank (possible expired, blocked, or limit reached)",
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
      analysis: "Bank's fraud detection system flagged transaction as suspicious",
      severity: "high",
      recoverable: false
    },
    customer_exit: {
      cause: "User Behavior",
      analysis: "Customer intentionally exited checkout before completing payment",
      severity: "low",
      recoverable: true
    },
    expired_card: {
      cause: "Card Validity",
      analysis: "Card has expired and is no longer valid",
      severity: "medium",
      recoverable: true
    },
    network_error: {
      cause: "Network Issue",
      analysis: "Network connectivity error during transaction",
      severity: "low",
      recoverable: true
    },
    max_retries: {
      cause: "Max Retries Exceeded",
      analysis: "Payment has already been retried maximum allowed times",
      severity: "high",
      recoverable: false
    }
  };

  return causes[failureReason] || {
    cause: "Unknown",
    analysis: "Unable to determine root cause",
    severity: "medium",
    recoverable: true
  };
}

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
  const decision = makeDecision(paymentData);

  return {
    paymentId: paymentData.id,
    agentDecision: decision.action,
    agentReasoning: decision.reasoning,
    rootCause: decision.rootCause,
    recoveryStrategy: decision.recoveryStrategy,
    actionResult: await executeTool(decision.action, decision.params, paymentData)
  };
}

function makeDecision(paymentData) {
  const { failureReason, customerTier, retryAttempts, checkoutAbandoned } = paymentData;
  const language = customerTier === "gold" ? "Hinglish" : "English";
  const rootCause = getRootCauseAnalysis(failureReason);

  // Max retries rule
  if (retryAttempts >= 3) {
    return {
      action: "escalate_to_human",
      params: { reason: "Max retries reached" },
      reasoning: "Customer has been retried 3+ times. Escalating to manual review.",
      rootCause: getRootCauseAnalysis("max_retries"),
      recoveryStrategy: "Manual intervention required"
    };
  }

  // Checkout abandoned - send message first
  if (checkoutAbandoned) {
    return {
      action: "send_recovery_message",
      params: {
        channel: paymentData.bestChannel,
        message: getHinglishMessage("customer_exit", language),
        language: language
      },
      reasoning: "Customer abandoned checkout. Sending recovery message via preferred channel.",
      rootCause: rootCause,
      recoveryStrategy: "Re-engagement message"
    };
  }

  // Fraud block - escalate
  if (failureReason === "fraud_block") {
    return {
      action: "escalate_to_human",
      params: { reason: "Fraud block detected. Customer verification needed." },
      reasoning: "Fraud block requires customer verification. Escalating.",
      rootCause: rootCause,
      recoveryStrategy: "Escalation + customer verification"
    };
  }

  // Timeout - retry immediately
  if (failureReason === "timeout" || failureReason === "network_error") {
    return {
      action: "retry_now",
      params: { reason: "Temporary network issue. Safe to retry immediately." },
      reasoning: "Network timeout detected. Retrying immediately is safe.",
      rootCause: rootCause,
      recoveryStrategy: "Immediate retry"
    };
  }

  // Insufficient funds - wait and retry
  if (failureReason === "insufficient_funds") {
    return {
      action: "retry_after",
      params: {
        hours: 24,
        reason: "Give customer time to add funds."
      },
      reasoning: "Insufficient funds. Waiting 24 hours gives customer time to top up account.",
      rootCause: rootCause,
      recoveryStrategy: "Delayed retry"
    };
  }

  // Card declined - send message
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

  // Expired card - escalate
  if (failureReason === "expired_card") {
    return {
      action: "escalate_to_human",
      params: { reason: "Card expired. Customer action required." },
      reasoning: "Expired card requires customer to update payment method.",
      rootCause: rootCause,
      recoveryStrategy: "Escalation + manual follow-up"
    };
  }

  // Customer exit - send recovery
  if (failureReason === "customer_exit") {
    return {
      action: "send_recovery_message",
      params: {
        channel: paymentData.bestChannel,
        message: getHinglishMessage("customer_exit", language),
        language: language
      },
      reasoning: "Customer exited. Sending friendly reminder to complete payment.",
      rootCause: rootCause,
      recoveryStrategy: "Re-engagement message"
    };
  }

  // Default
  return {
    action: "retry_after",
    params: {
      hours: 24,
      reason: "Standard retry protocol."
    },
    reasoning: `Unknown failure reason: ${failureReason}. Scheduling standard retry.`,
    rootCause: rootCause,
    recoveryStrategy: "Delayed retry"
  };
}