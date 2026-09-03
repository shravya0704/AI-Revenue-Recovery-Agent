import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Comparison from "./Comparison";
import TestPlayground from "./TestPlayground";

export default function Dashboard({ hideComparison = false }) {
  const [analytics, setAnalytics] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const analyticsRes = await fetch("http://localhost:4000/api/analytics");
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      const analysesRes = await fetch("http://localhost:4000/api/analyses");
      const analysesData = await analysesRes.json();
      setAnalyses(analysesData);

      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (!analytics) return <div className="error">Failed to load data</div>;

  // Filter analyses
  const filtered =
    filter === "all"
      ? analyses
      : analyses.filter((a) => a.agent_decision === filter);

  return (
    <div className="dashboard">
      <header className="header">
        <h1>🤖 AI Revenue Recovery Agent</h1>
        <p>Real-time payment failure detection & recovery</p>
      </header>

      <TestPlayground />

      {/* Metrics Cards */}
      <section className="metrics">
        <div className="card total">
          <div className="value">{analytics.total}</div>
          <div className="label">Payments Analyzed</div>
        </div>

        <div className="card retry">
          <div className="value">{analytics.metrics.retry_decisions}</div>
          <div className="label">Retried (Immediate)</div>
        </div>

        <div className="card notify">
          <div className="value">{analytics.metrics.notification_decisions}</div>
          <div className="label">Recovery Messages Sent</div>
        </div>

        <div className="card escalate">
          <div className="value">{analytics.metrics.escalated_decisions}</div>
          <div className="label">Escalated to Human</div>
        </div>

        <div className="card recovery">
          <div className="value">{analytics.metrics.recovery_rate}</div>
          <div className="label">Recovery Rate</div>
        </div>
      </section>

      {/* Comparison */}
      {!hideComparison && <Comparison />}

      {/* Decision Breakdown */}
      <section className="breakdown">
        <h2>Agent Decisions</h2>
        <div className="chart">
          {Object.entries(analytics.decisions).map(([decision, count]) => (
            <div key={decision} className="bar-container">
              <div className="label">{decision}</div>
              <div className="bar">
                <div
                  className="fill"
                  style={{
                    width: `${(count / analytics.total) * 100}%`
                  }}
                ></div>
              </div>
              <div className="count">{count}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Audit Trail */}
      <section className="audit-trail">
        <h2>Audit Trail - Payment Analysis Log</h2>

        {/* Filter Buttons */}
        <div className="filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({analyses.length})
          </button>
          <button
            className={`filter-btn ${filter === "retry_now" ? "active" : ""}`}
            onClick={() => setFilter("retry_now")}
          >
            Retry Now
          </button>
          <button
            className={`filter-btn ${filter === "retry_after" ? "active" : ""}`}
            onClick={() => setFilter("retry_after")}
          >
            Retry Later
          </button>
          <button
            className={`filter-btn ${filter === "send_recovery_message" ? "active" : ""}`}
            onClick={() => setFilter("send_recovery_message")}
          >
            Send Message
          </button>
          <button
            className={`filter-btn ${filter === "escalate_to_human" ? "active" : ""}`}
            onClick={() => setFilter("escalate_to_human")}
          >
            Escalate
          </button>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Agent Decision</th>
                <th>Action Status</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((analysis) => (
                <tr key={analysis.id} className={`status-${analysis.action_result?.status}`}>
                  <td className="payment-id">{analysis.payment_id}</td>
                  <td className="decision">
                    <span className={`badge ${analysis.agent_decision}`}>
                      {analysis.agent_decision.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="status">
                    <span className={`status-badge ${analysis.action_result?.status}`}>
                      {analysis.action_result?.status || "pending"}
                    </span>
                  </td>
                  <td className="details">
                    {analysis.action_result?.reason ||
                      analysis.action_result?.message ||
                      "-"}
                  </td>
                  <td className="timestamp">
                    {new Date(analysis.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary">
          Showing {filtered.length} of {analyses.length} analyses
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>
          💡 This agent demonstrates real-time payment recovery using intelligent decision
          logic and customer-first approach.
        </p>
      </footer>
    </div>
  );
}