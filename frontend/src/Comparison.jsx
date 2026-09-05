import React, { useState, useEffect } from "react";
import "./Comparison.css";

export default function Comparison() {
    const [comparison, setComparison] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const compRes = await fetch("http://localhost:4000/api/comparison");
            const compData = await compRes.json();
            setComparison(compData);

            const feedRes = await fetch("http://localhost:4000/api/feedback-loop");
            const feedData = await feedRes.json();
            setFeedback(feedData);

            setLoading(false);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    }

    if (loading) return <div className="loading">Loading...</div>;
    if (!comparison || !feedback) return <div className="error">Failed to load data</div>;

    const comp = comparison;
    const delta = comp.improvement;

    return (
        <div className="comparison-section">
            {/* Comparison Header */}
            <h2>Dumb Bot vs Smart Agent</h2>
            <p className="subtitle">See how intelligent routing improves recovery</p>

            {/* Comparison Cards */}
            <div className="comparison-container">
                {/* Dumb Bot Card */}
                <div className="comparison-card dumb">
                    <h3>{comp.dumb_bot.name}</h3>
                    <div className="strategy">{comp.dumb_bot.strategy}</div>

                    <div className="metric">
                        <div className="label">Estimated Recovered</div>
                        <div className="value">{comp.dumb_bot.estimated_recovered}</div>
                    </div>

                    <div className="metric">
                        <div className="label">Recovery Rate</div>
                        <div className="value recovery-rate">{comp.dumb_bot.recovery_rate}</div>
                    </div>

                    <div className="pros-cons">
                        <div className="pros">
                            <strong>✓ Pros:</strong>
                            <ul>
                                {comp.dumb_bot.pros.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="cons">
                            <strong>✗ Cons:</strong>
                            <ul>
                                {comp.dumb_bot.cons.map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="false-pos">
                        <strong>False Positives:</strong> {comp.dumb_bot.false_positives}
                    </div>
                </div>

                {/* Improvement Arrow */}
                <div className="improvement-arrow">
                    <div className="arrow-up">↑</div>
                    <div className="delta">
                        +{delta.recovery_delta} payments
                        <br />
                        ({delta.recovery_delta_pct}% better)
                    </div>
                </div>

                {/* Smart Agent Card */}
                <div className="comparison-card smart">
                    <h3>{comp.smart_agent.name}</h3>
                    <div className="strategy">{comp.smart_agent.strategy}</div>

                    <div className="metric">
                        <div className="label">Estimated Recovered</div>
                        <div className="value">{comp.smart_agent.estimated_recovered}</div>
                    </div>

                    <div className="metric">
                        <div className="label">Recovery Rate</div>
                        <div className="value recovery-rate">{comp.smart_agent.recovery_rate}</div>
                    </div>

                    <div className="pros-cons">
                        <div className="pros">
                            <strong>✓ Pros:</strong>
                            <ul>
                                {comp.smart_agent.pros.map((p, i) => (
                                    <li key={i}>{p}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="cons">
                            <strong>✗ Cons:</strong>
                            <ul>
                                {comp.smart_agent.cons.map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="false-pos">
                        <strong>False Positives:</strong> {comp.smart_agent.false_positives}
                    </div>
                </div>
            </div>

            {/* Feedback Loop Section */}
            <h2 style={{ marginTop: "60px" }}>Customer Feedback Loop - Channel Performance</h2>
            <p className="subtitle">Which recovery channel works best? Agent learns and optimizes.</p>

            <div className="feedback-container">
                {Object.entries(feedback.channels).map(([channel, data]) => (
                    <div key={channel} className="feedback-card">
                        <div className="channel-name">
                            {channel === "sms" && "SMS"}
                            {channel === "email" && "Email"}
                            {channel === "in_app" && "In-App Notification"}
                        </div>

                        <div className="feedback-metric">
                            <div className="label">Messages Sent</div>
                            <div className="value">{data.messages_sent}</div>
                        </div>

                        <div className="feedback-metric">
                            <div className="label">Opt-In Rate</div>
                            <div className="value highlight">{data.opt_in_rate}</div>
                        </div>

                        <div className="feedback-metric">
                            <div className="label">Recovered</div>
                            <div className="value">{data.recovery_count} payments</div>
                        </div>

                        <div className="feedback-metric">
                            <div className="label">Recovery Rate</div>
                            <div className="value highlight">{data.recovery_rate}</div>
                        </div>

                        <div className="recommendation">{data.recommendation}</div>
                    </div>
                ))}
            </div>

            <div className="overall-feedback">
                <strong>Overall Performance:</strong>
                <p>
                    Total Messages Sent: <strong>{feedback.total_messages_sent}</strong> | Overall Opt-In
                    Rate: <strong>{feedback.overall_opt_in_rate}</strong> | Total Recoveries:{" "}
                    <strong>{feedback.total_recoveries}</strong>
                </p>
                <p className="insight">
                    The system recommends <strong>{feedback.best_channel}</strong> as the primary recovery channel for maximum opt-in and recovery rates.
                </p>
            </div>
        </div>
    );
}