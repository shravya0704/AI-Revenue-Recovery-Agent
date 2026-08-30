// 100 realistic failed payment scenarios
export const failedPayments = [
  {
    id: "PAY_001",
    amount: 5000,
    failureReason: "insufficient_funds",
    customerTier: "gold",
    retryAttempts: 1,
    timeSinceFailure: "2 hours",
    checkoutAbandoned: false,
    bestChannel: "SMS"
  },
  {
    id: "PAY_002",
    amount: 15000,
    failureReason: "timeout",
    customerTier: "silver",
    retryAttempts: 0,
    timeSinceFailure: "30 mins",
    checkoutAbandoned: false,
    bestChannel: "Email"
  },
  {
    id: "PAY_003",
    amount: 50000,
    failureReason: "fraud_block",
    customerTier: "gold",
    retryAttempts: 0,
    timeSinceFailure: "1 hour",
    checkoutAbandoned: false,
    bestChannel: "SMS"
  },
  {
    id: "PAY_004",
    amount: 3000,
    failureReason: "customer_exit",
    customerTier: "bronze",
    retryAttempts: 0,
    timeSinceFailure: "5 mins",
    checkoutAbandoned: true,
    bestChannel: "In-app"
  },
  {
    id: "PAY_005",
    amount: 8000,
    failureReason: "card_declined",
    customerTier: "silver",
    retryAttempts: 2,
    timeSinceFailure: "4 hours",
    checkoutAbandoned: false,
    bestChannel: "SMS"
  },
  // ... Generate 95 more with variation
  // I'll give you a generator function to create these
];

// Helper to generate realistic scenarios
export function generateScenarios(count = 100) {
  const reasons = [
    "insufficient_funds",
    "timeout",
    "fraud_block",
    "customer_exit",
    "card_declined",
    "network_error",
    "expired_card",
    "max_retries"
  ];
  
  const tiers = ["gold", "silver", "bronze"];
  const channels = ["SMS", "Email", "In-app"];

  const scenarios = [];

  for (let i = 1; i <= count; i++) {
    scenarios.push({
      id: `PAY_${String(i).padStart(3, "0")}`,
      amount: Math.floor(Math.random() * 50000) + 1000,
      failureReason: reasons[Math.floor(Math.random() * reasons.length)],
      customerTier: tiers[Math.floor(Math.random() * tiers.length)],
      retryAttempts: Math.floor(Math.random() * 3),
      timeSinceFailure:
        Math.floor(Math.random() * 48) + " hours or " + Math.floor(Math.random() * 60) + " mins",
      checkoutAbandoned: Math.random() > 0.7,
      bestChannel: channels[Math.floor(Math.random() * channels.length)]
    });
  }

  return scenarios;
}