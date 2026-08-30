import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { analyzePayment } from "./agent.js";
import { initializeDB, storePaymentAnalysis, getAllAnalyses, getAnalytics } from "./db.js";
import { generateScenarios } from "./data/scenarios.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB on startup
let db;
(async () => {
  db = await initializeDB();
  console.log("Server ready");
})();

// === ROUTES ===

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Analyze a single payment
app.post("/api/analyze", async (req, res) => {
  try {
    const paymentData = req.body;

    // Validate input
    if (!paymentData.id) {
      return res.status(400).json({ error: "Payment ID required" });
    }

    // Analyze
    const analysis = await analyzePayment(paymentData);

    // Store result
    await storePaymentAnalysis(analysis);

    res.json(analysis);
  } catch (error) {
    console.error("Analyze error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Batch analyze all 100 scenarios
app.post("/api/batch-analyze", async (req, res) => {
  try {
    console.log("Starting batch analysis of 100 payments...");
    
    const scenarios = generateScenarios(100);
    const results = [];
    let processed = 0;

    for (const scenario of scenarios) {
      try {
        const analysis = await analyzePayment(scenario);
        await storePaymentAnalysis(analysis);
        results.push(analysis);
        processed++;

        // Log progress every 10
        if (processed % 10 === 0) {
          console.log(`✓ Processed ${processed}/100`);
        }
      } catch (error) {
        console.error(`Error analyzing ${scenario.id}:`, error.message);
        results.push({
          paymentId: scenario.id,
          error: error.message
        });
      }
    }

    console.log(`✓ Batch complete: ${processed}/100 successful`);

    res.json({
      total: scenarios.length,
      successful: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
      results: results
    });
  } catch (error) {
    console.error("Batch analyze error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all analyses
app.get("/api/analyses", async (req, res) => {
  try {
    const analyses = await getAllAnalyses();
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics/dashboard data
app.get("/api/analytics", async (req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single payment analysis
app.get("/api/analyses/:paymentId", async (req, res) => {
  try {
    const analyses = await getAllAnalyses();
    const analysis = analyses.find((a) => a.payment_id === req.params.paymentId);

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all data (for testing)
app.post("/api/clear", async (req, res) => {
  try {
    const { data, error } = await db.from("payment_analyses").delete().neq("id", 0);
    if (error) throw error;
    res.json({ message: "All data cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`  - POST /api/analyze - Analyze single payment`);
  console.log(`  - POST /api/batch-analyze - Analyze all 100`);
  console.log(`  - GET /api/analyses - Get all results`);
  console.log(`  - GET /api/analytics - Dashboard data`);
});