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
  const decision = makeDecision(paymentData);

  return {
    paymentId: paymentData.id,
    agentDecision: decision.action,
    agentReasoning: decision.reasoning,
    actionResult: await executeTool(decision.action, decision.params, paymentData)
  };
}

function makeDecision(paymentData) {
  const { failureReason, customerTier, retryAttempts, checkoutAbandoned } = paymentData;

  // Determine language preference
  const language = customerTier === "gold" ? "Hinglish" : "English";

  // Max retries rule
  if (retryAttempts >= 3) {
    return {
      action: "escalate_to_human",
      params: { reason: "Max retries reached" },
      reasoning: "Customer has been retried 3+ times. Escalating to manual review."
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
      reasoning: "Customer abandoned checkout. Sending recovery message via preferred channel."
    };
  }

  // Fraud block - escalate
  if (failureReason === "fraud_block") {
    return {
      action: "escalate_to_human",
      params: { reason: "Fraud block detected. Customer verification needed." },
      reasoning: "Fraud block requires customer verification. Escalating."
    };
  }

  // Timeout - retry immediately
  if (failureReason === "timeout" || failureReason === "network_error") {
    return {
      action: "retry_now",
      params: { reason: "Temporary network issue. Safe to retry immediately." },
      reasoning: "Network timeout detected. Retrying immediately is safe."
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
      reasoning: "Insufficient funds. Waiting 24 hours gives customer time to top up account."
    };
  }

  // Card declined - send message then retry
  if (failureReason === "card_declined") {
    return {
      action: "send_recovery_message",
      params: {
        channel: paymentData.bestChannel,
        message: getHinglishMessage("card_declined", language),
        language: language
      },
      reasoning: "Card declined. Notifying customer to use different card."
    };
  }

  // Expired card - escalate
  if (failureReason === "expired_card") {
    return {
      action: "escalate_to_human",
      params: { reason: "Card expired. Customer action required." },
      reasoning: "Expired card requires customer to update payment method."
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
      reasoning: "Customer exited. Sending friendly reminder to complete payment."
    };
  }

  // Default: retry after 24 hours
  return {
    action: "retry_after",
    params: {
      hours: 24,
      reason: "Standard retry protocol."
    },
    reasoning: `Unknown failure reason: ${failureReason}. Scheduling standard retry.`
  };
}