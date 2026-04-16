const mToFt = (m) => (m ? Math.round(m * 3.281).toLocaleString() : "—");
const msToKnots = (ms) => (ms ? Math.round(ms * 1.944) : "—");

export default function DashboardPage({ stats, flights, alerts, loading }) {
  const topFlights = flights?.slice(0, 8) ?? [];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Overview</h1>
        <p style={{ fontSize: 11, color: "#334155", marginTop: 4, letterSpacing: "0.05em" }}>REAL-TIME AIRSPACE · NORTH AMERICA</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Active flights</div>
          <div className="stat-value" style={{ opacity: loading ? 0.3 : 1 }}>{stats?.activeFlights?.toLocaleString() ?? "—"}</div>
          <div className="stat-sub">airborne now</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open alerts</div>
          <div className="stat-value" style={{ color: (stats?.openAlerts ?? 0) > 0 ? "#ef4444" : "#f1f5f9", opacity: loading ? 0.3 : 1 }}>
            {stats?.openAlerts ?? "—"}
          </div>
          <div className="stat-sub">unresolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg delay</div>
          <div className="stat-value" style={{ opacity: loading ? 0.3 : 1 }}>{stats?.avgDelayMinutes ? `${stats.avgDelayMinutes}m` : "—"}</div>
          <div className="stat-sub">last 24 hours</div>
        </div>
      </div>

      {/* Recent flights */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="section-title">Recent flights</div>
        <table>
          <thead>
            <tr>
              <th>Callsign</th>
              <th>Country</th>
              <th>Altitude</th>
              <th>Speed</th>
              <th>Heading</th>
            </tr>
          </thead>
          <tbody>
            {topFlights.map((f) => (
              <tr key={f.icao24}>
                <td style={{ color: "#38bdf8", fontWeight: 500 }}>{f.callsign ?? "—"}</td>
                <td>{f.origin_country ?? "—"}</td>
                <td>{mToFt(f.altitude_m)} ft</td>
                <td>{msToKnots(f.velocity_ms)} kts</td>
                <td>{f.heading != null ? `${Math.round(f.heading)}°` : "—"}</td>
              </tr>
            ))}
            {topFlights.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#1e293b" }}>No flight data</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent alerts */}
      <div className="card">
        <div className="section-title">Recent alerts</div>
        {alerts?.slice(0, 5).map((a) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "0.5px solid #0f172a" }}>
            <span className={`badge ${a.severity === "critical" ? "badge-red" : a.severity === "warning" ? "badge-yellow" : "badge-green"}`}>
              {a.severity}
            </span>
            <span style={{ fontSize: 12, color: "#64748b", flex: 1 }}>
              <span style={{ color: "#38bdf8" }}>{a.callsign}</span> — {a.message}
            </span>
          </div>
        ))}
        {(!alerts || alerts.length === 0) && (
          <div style={{ fontSize: 12, color: "#1e293b", padding: "8px 0" }}>No open alerts</div>
        )}
      </div>
    </div>
  );
}
