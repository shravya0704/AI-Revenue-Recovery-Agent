// Fixed, deterministic test scenarios
export const failedPayments = [
  // Timeout scenarios (20 total) - high recovery with retry_now
  ...Array(20).fill(null).map((_, i) => ({
    id: `PAY_${String(i + 1).padStart(3, '0')}`,
    amount: 5000 + (i * 100),
    failureReason: "timeout",
    customerTier: i % 3 === 0 ? "gold" : "silver",
    retryAttempts: 0,
    timeSinceFailure: "5 mins",
    checkoutAbandoned: false,
    bestChannel: "SMS"
  })),

  // Network errors (15 total) - high recovery with retry_now
  ...Array(15).fill(null).map((_, i) => ({
    id: `PAY_${String(i + 21).padStart(3, '0')}`,
    amount: 3000 + (i * 150),
    failureReason: "network_error",
    customerTier: i % 2 === 0 ? "gold" : "bronze",
    retryAttempts: 0,
    timeSinceFailure: "3 mins",
    checkoutAbandoned: false,
    bestChannel: "Email"
  })),

  // Insufficient funds (20 total) - medium recovery with retry_after
  ...Array(20).fill(null).map((_, i) => ({
    id: `PAY_${String(i + 36).padStart(3, '0')}`,
    amount: 8000 + (i * 200),
    failureReason: "insufficient_funds",
    customerTier: i % 2 === 0 ? "gold" : "silver",
    retryAttempts: 1,
    timeSinceFailure: "2 hours",
    checkoutAbandoned: false,
    bestChannel: "SMS"
  })),

  // Customer exit/checkout abandoned (15 total) - medium recovery with send_recovery_message
  ...Array(15).fill(null).map((_, i) => ({
    id: `PAY_${String(i + 56).padStart(3, '0')}`,
    amount: 4500 + (i * 120),
    failureReason: "customer_exit",
    customerTier: "bronze",
    retryAttempts: 0,
    timeSinceFailure: "10 mins",
    checkoutAbandoned: true,
    bestChannel: i % 2 === 0 ? "SMS" : "In-app"
  })),

  // Card declined (15 total) - medium recovery with send_recovery_message
  ...Array(15).fill(null).map((_, i) => ({
    id: `PAY_${String(i + 71).padStart(3, '0')}`,
    amount: 12000 + (i * 300),
    failureReason: "card_declined",
    customerTier: i % 3 === 0 ? "gold" : "silver",
    retryAttempts: 0,
    timeSinceFailure: "1 hour",
    checkoutAbandoned: false,
    bestChannel: "Email"
  })),

  // Fraud blocks (10 total) - low recovery with escalate_to_human
  ...Array(10).fill(null).map((_, i) => ({
    id: `PAY_${String(i + 86).padStart(3, '0')}`,
    amount: 50000 + (i * 1000),
    failureReason: "fraud_block",
    customerTier: "gold",
    retryAttempts: 0,
    timeSinceFailure: "30 mins",
    checkoutAbandoned: false,
    bestChannel: "SMS"
  }))
];

export function generateScenarios(count = 100) {
  return failedPayments.slice(0, count);
}