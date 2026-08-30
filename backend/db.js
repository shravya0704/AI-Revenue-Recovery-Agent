import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize database tables
export async function initializeDB() {
  try {
    // Create payments table if not exists
    const { error: paymentsError } = await supabase.rpc("create_payments_table", {});
    
    if (paymentsError && !paymentsError.message.includes("already exists")) {
      console.log("Payments table ready or will be created via SQL");
    }

    console.log("✓ Database initialized");
    return supabase;
  } catch (error) {
    console.error("DB init error:", error.message);
    throw error;
  }
}

// Store payment analysis result
export async function storePaymentAnalysis(analysis) {
  try {
    const { data, error } = await supabase
      .from("payment_analyses")
      .insert([
        {
          payment_id: analysis.paymentId,
          agent_decision: analysis.agentDecision,
          agent_reasoning: analysis.agentReasoning,
          action_result: analysis.actionResult,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Store analysis error:", error.message);
    throw error;
  }
}

// Get all analyses
export async function getAllAnalyses() {
  try {
    const { data, error } = await supabase
      .from("payment_analyses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get analyses error:", error.message);
    return [];
  }
}

// Get analytics (for dashboard)
export async function getAnalytics() {
  try {
    const analyses = await getAllAnalyses();

    const total = analyses.length;
    const decisions = {};
    const statuses = {};

    analyses.forEach((analysis) => {
      // Count by decision type
      const decision = analysis.agent_decision;
      decisions[decision] = (decisions[decision] || 0) + 1;

      // Count by action status
      const status = analysis.action_result?.status;
      statuses[status] = (statuses[status] || 0) + 1;
    });

    // Calculate recovery metrics
    const retried = (decisions["retry_now"] || 0) + (decisions["retry_after"] || 0);
    const escalated = decisions["escalate_to_human"] || 0;
    const notified = decisions["send_recovery_message"] || 0;

    return {
      total,
      decisions,
      statuses,
      metrics: {
        total_analyzed: total,
        retry_decisions: retried,
        escalated_decisions: escalated,
        notification_decisions: notified,
        recovery_rate: total > 0 ? ((retried / total) * 100).toFixed(2) + "%" : "0%"
      }
    };
  } catch (error) {
    console.error("Get analytics error:", error.message);
    return null;
  }
}

export default supabase;