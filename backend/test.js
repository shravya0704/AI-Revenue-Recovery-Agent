import dotenv from "dotenv";
import { analyzePayment } from "./agent.js";

dotenv.config();

const testPayment = {
  id: "PAY_TEST_001",
  amount: 5000,
  failureReason: "insufficient_funds",
  customerTier: "gold",
  retryAttempts: 1,
  timeSinceFailure: "2 hours",
  checkoutAbandoned: false,
  bestChannel: "SMS"
};

console.log("Testing agent...");
const result = await analyzePayment(testPayment);
console.log(JSON.stringify(result, null, 2));