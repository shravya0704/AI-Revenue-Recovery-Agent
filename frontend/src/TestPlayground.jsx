import React, { useState } from "react";
import "./TestPlayground.css";

export default function TestPlayground() {
  const [testCase, setTestCase] = useState("timeout");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testCases = {
    timeout: {
      id: "PAY_TEST_TIMEOUT",
      amount: 5000,
      failureReason: "timeout",
      customerTier: "silver",
      retryAttempts: 0,
      timeSinceFailure: "5 mins",
      checkoutAbandoned: false,
      bestChannel: "SMS",
      description: "Network timeout - temporary issue"
    },
    fraud_block: {
      id: "PAY_TEST_FRAUD",
      amount: 25000,
      failureReason: "fraud_block",
      customerTier: "gold",
      retryAttempts: 0,
      timeSinceFailure: "10 mins",
      checkoutAbandoned: false,
      bestChannel: "SMS",
      description: "Fraud block - requires customer verification"
    }
  };

  async function runTest() {
    setLoading(true);
    try {
      const payment = testCases[testCase];
      const response = await fetch("http://localhost:4000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment)
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  }

  return (
    <div className="test-playground">
      <h2>Agent Test Playground</h2>
      <p>Manually test the agent logic with realistic payment scenarios</p>

      <div className="test-container">
        {/* Test Case Selector */}
        <div className="selector">
          <label>Choose Test Case:</label>
          <select value={testCase} onChange={(e) => setTestCase(e.target.value)}>
            <option value="timeout">Test 1: Network Timeout (Should Retry Now)</option>
            <option value="fraud_block">Test 2: Fraud Block (Should Escalate)</option>
          </select>
          <p className="test-desc">{testCases[testCase].description}</p>
        </div>

        {/* Run Button */}
        <button onClick={runTest} disabled={loading} className="run-btn">
          {loading ? "Running..." : "Run Test"}
        </button>

        {/* Results */}
        {result && (
          <div className="result">
            <h3>Agent Decision</h3>
            
            <div className="result-item">
              <span className="label">Payment ID:</span>
              <span className="value">{result.paymentId}</span>
            </div>

            <div className="result-item">
              <span className="label">Failure Reason:</span>
              <span className="value">{result.failureReason || testCases[testCase].failureReason || "N/A"}</span>
            </div>

            {result.rootCause && (
              <div className="result-item">
                <span className="label">Root Cause:</span>
                <span className="value">{result.rootCause?.cause}</span>
              </div>
            )}

            {result.rootCause && (
              <div className="result-item">
                <span className="label">Analysis:</span>
                <span className="value detail">{result.rootCause?.analysis}</span>
              </div>
            )}

            {result.rootCause && (
              <div className="result-item">
                <span className="label">Severity:</span>
                <span className="value">{result.rootCause?.severity}</span>
              </div>
            )}

            {result.recoveryStrategy && (
              <div className="result-item">
                <span className="label">Recovery Strategy:</span>
                <span className="value strategy">{result.recoveryStrategy}</span>
              </div>
            )}

            <div className="result-item">
              <span className="label">Agent Decision:</span>
              <span className={`value decision ${result.agentDecision || ""}`}>
                {result.agentDecision ? result.agentDecision.replace(/_/g, " ") : "N/A"}
              </span>
            </div>

            <div className="result-item">
              <span className="label">Reasoning:</span>
              <span className="value detail">{result.agentReasoning}</span>
            </div>

            {result.actionResult && (
              <div className="result-item">
                <span className="label">Action Status:</span>
                <span className="value">{result.actionResult?.status}</span>
              </div>
            )}

            {result.actionResult?.reason && (
              <div className="result-item">
                <span className="label">Action Details:</span>
                <span className="value detail">{result.actionResult?.reason}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}