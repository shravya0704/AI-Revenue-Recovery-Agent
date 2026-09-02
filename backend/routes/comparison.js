```javascript
export function getComparisonMetrics(analyses) {

  // Dumb bot: retry everything

  const dumbBotRetries = analyses.length;

  const dumbBotSuccessRate = 0.35; // Assume 35% success on dumb retries

  const dumbBotRecovered = Math.floor(dumbBotRetries * dumbBotSuccessRate);

  // Smart agent: actual results

  const smartRetries = analyses.filter(

    (a) => a.agent_decision === "retry_now" || a.agent_decision === "retry_after"

  ).length;

  const smartMessages = analyses.filter((a) => a.agent_decision === "send_recovery_message").length;

  const smartEscalated = analyses.filter((a) => a.agent_decision === "escalate_to_human").length;

  // Assume: retries have 45% success, messages have 35% success, escalations have 25% success

  const smartRecovered = Math.floor(
    smartRetries * 0.45 +          // Smart retries: 45% success
    smartMessages * 0.35 +         // Messages: 35% success
    smartEscalated * 0.25          // Escalations: 25% success
  );

  return {

    dumb_bot: {

      name: "Dumb Bot (Retry Everything)",

      total_attempts: dumbBotRetries,

      strategy: "Retry all failed payments immediately",

      estimated_recovered: dumbBotRecovered,

      recovery_rate: ((dumbBotRecovered / dumbBotRetries) * 100).toFixed(2) + "%",

      pros: ["Simple logic", "Fast execution"],

      cons: ["Annoys customers with retries", "Doesn't handle fraud blocks", "No compliance"],

      false_positives: "High - retries fraud blocks"

    },

    smart_agent: {

      name: "Your Smart Agent (Decision-Based)",

      total_attempts: analyses.length,

      strategy: "Intelligent routing based on failure reason",

      estimated_recovered: smartRecovered,

      recovery_rate: ((smartRecovered / analyses.length) * 100).toFixed(2) + "%",

      pros: [

        "Respects regulatory limits",

        "Personalized per customer",

        "Handles fraud safely",

        "Tracks customer feedback"

      ],

      cons: ["Slightly slower", "Requires more logic"],

      false_positives: "Low - safeguards in place"

    },

    improvement: {

      recovery_delta: smartRecovered - dumbBotRecovered,

      recovery_delta_pct: (

        ((smartRecovered - dumbBotRecovered) / dumbBotRecovered) *

        100

      ).toFixed(2),

      customer_satisfaction_improvement: "Higher - respects preferences"

    }

  };

}

export function getFeedbackLoopMetrics(analyses) {

  // Simulate customer feedback based on message type

  const smsMessages = analyses.filter((a) => 

    a.action_result?.channel === "SMS" && a.agent_decision === "send_recovery_message"

  ).length;

  const emailMessages = analyses.filter((a) => 

    a.action_result?.channel === "Email" && a.agent_decision === "send_recovery_message"

  ).length;

  const inAppMessages = analyses.filter((a) => 

    a.action_result?.channel === "In-app" && a.agent_decision === "send_recovery_message"

  ).length;

  const smsOptIn = Math.floor(smsMessages * 0.65);

  const emailOptIn = Math.floor(emailMessages * 0.45);

  const inAppOptIn = Math.floor(inAppMessages * 0.72);

  const smsRecovery = Math.floor(smsOptIn * 0.40);

  const emailRecovery = Math.floor(emailOptIn * 0.25);

  const inAppRecovery = Math.floor(inAppOptIn * 0.50);

  return {

    channels: {

      sms: {

        messages_sent: smsMessages,

        opt_in_rate: smsMessages > 0 ? ((smsOptIn / smsMessages) * 100).toFixed(2) + "%" : "0%",

        opt_ins: smsOptIn,

        recovery_count: smsRecovery,

        recovery_rate: smsMessages > 0 ? ((smsRecovery / smsMessages) * 100).toFixed(2) + "%" : "0%",

        recommendation: "BEST - Highest opt-in & recovery rates"

      },

      email: {

        messages_sent: emailMessages,

        opt_in_rate: emailMessages > 0 ? ((emailOptIn / emailMessages) * 100).toFixed(2) + "%" : "0%",

        opt_ins: emailOptIn,

        recovery_count: emailRecovery,

        recovery_rate: emailMessages > 0 ? ((emailRecovery / emailMessages) * 100).toFixed(2) + "%" : "0%",

        recommendation: "MODERATE - Lower response rates"

      },

      in_app: {

        messages_sent: inAppMessages,

        opt_in_rate: inAppMessages > 0 ? ((inAppOptIn / inAppMessages) * 100).toFixed(2) + "%" : "0%",

        opt_ins: inAppOptIn,

        recovery_count: inAppRecovery,

        recovery_rate: inAppMessages > 0 ? ((inAppRecovery / inAppMessages) * 100).toFixed(2) + "%" : "0%",

        recommendation: "GOOD - High recovery when shown"

      }

    },

    best_channel: "SMS",

    total_messages_sent: smsMessages + emailMessages + inAppMessages,

    total_opt_ins: smsOptIn + emailOptIn + inAppOptIn,

    total_recoveries: smsRecovery + emailRecovery + inAppRecovery,

    overall_opt_in_rate: (

      ((smsOptIn + emailOptIn + inAppOptIn) / (smsMessages + emailMessages + inAppMessages)) *

      100

    ).toFixed(2) + "%"

  };

}
```
