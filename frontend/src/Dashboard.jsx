const summary = [
  { name: 'Retry now', value: 32 },
  { name: 'Retry later', value: 21 },
  { name: 'Email outreach', value: 16 },
  { name: 'Manual review', value: 12 },
];

const auditTrail = [
  { id: 1, timestamp: '2026-08-28 10:12', action: 'AI analyzed failed payment', result: 'retry_now recommended' },
  { id: 2, timestamp: '2026-08-28 10:24', action: 'Customer emailed', result: 'awaiting confirmation' },
  { id: 3, timestamp: '2026-08-28 11:03', action: 'Retry scheduled', result: 'queued for 2 hours' },
];

function Dashboard() {
  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Recovery dashboard</p>
          <h1>AI Revenue Recovery Agent</h1>
        </div>
        <div className="chip">Live audit trail</div>
      </header>

      <section className="stats-grid">
        {summary.map((item) => (
          <article key={item.name} className="stat-card">
            <span>{item.name}</span>
            <strong>{item.value}%</strong>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <div className="panel">
          <h2>Recommendation mix</h2>
          <div className="bars" aria-label="recommendation breakdown">
            {summary.map((item) => (
              <div key={item.name} className="bar-row">
                <div className="label">{item.name}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${item.value}%` }} />
                </div>
                <div className="value">{item.value}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Audit trail</h2>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((row) => (
                <tr key={row.id}>
                  <td>{row.timestamp}</td>
                  <td>{row.action}</td>
                  <td>{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
