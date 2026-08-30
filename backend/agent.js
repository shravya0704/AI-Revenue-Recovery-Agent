import dotenv from "dotenv";
dotenv.config();

import Groq from "groq-sdk";
import { executeTool } from "./tools.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function analyzePayment(paymentData) {
  // Simple decision logic WITHOUT relying on Claude parsing
  const decision = makeDecision(paymentData);

  return {
    paymentId: paymentData.id,
    agentDecision: decision.action,
    agentReasoning: decision.reasoning,
    actionResult: await executeTool(decision.action, decision.params, paymentData)
  };
}

// Deterministic decision logic (no LLM needed for MVP)
function makeDecision(paymentData) {
  const { failureReason, customerTier, retryAttempts, checkoutAbandoned } = paymentData;

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
        message: "Hey! Did you forget something? Complete your checkout now with 1-click.",
        language: "English"
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
        message: "Your card was declined. Try another payment method or contact your bank.",
        language: "English"
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
        message: "Your payment is still pending. Complete it now to avoid order delay.",
        language: "English"
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