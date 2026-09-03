import React, { useState } from "react";
import "./Tabs.css";
import Dashboard from "./Dashboard";
import Comparison from "./Comparison";

export default function Tabs() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="tabs-wrapper">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Live Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "analysis" ? "active" : ""}`}
          onClick={() => setActiveTab("analysis")}
        >
          📈 Comparison & Analysis
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === "dashboard" && (
          <div className="tab-pane">
            <Dashboard hideComparison={true} />
          </div>
        )}
        {activeTab === "analysis" && (
          <div className="tab-pane">
            <Comparison />
          </div>
        )}
      </div>
    </div>
  );
}