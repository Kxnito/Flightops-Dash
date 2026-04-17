const API_BASE = import.meta.env.VITE_API_URL || "https://api.flightops-dashboard.xyz/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function AlertsPage({ alerts, loading, onResolve }) {
  async function resolve(id) {
    await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: "PATCH",
      headers: API_KEY ? { "x-api-key": API_KEY } : {},
    });
    onResolve();
  }

  const critical = alerts?.filter((a) => a.severity === "critical") ?? [];
  const warning  = alerts?.filter((a) => a.severity === "warning")  ?? [];
  const info     = alerts?.filter((a) => a.severity === "info")     ?? [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Alerts</h1>
        <p style={{ fontSize: 11, color: "#334155", marginTop: 4, letterSpacing: "0.05em" }}>
          {alerts?.length ?? "—"} UNRESOLVED
        </p>
      </div>

      {[{ label: "Critical", items: critical, color: "#ef4444" },
        { label: "Warning",  items: warning,  color: "#eab308" },
        { label: "Info",     items: info,     color: "#38bdf8" }
      ].map(({ label, items, color }) => items.length > 0 && (
        <div key={label} className="card" style={{ marginBottom: 16, opacity: loading ? 0.4 : 1 }}>
          <div className="section-title" style={{ color }}>{label} · {items.length}</div>
          {items.map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "0.5px solid #0f172a" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  <span style={{ color: "#38bdf8", fontWeight: 500 }}>{a.callsign}</span> — {a.message}
                </div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>{timeAgo(a.created_at)}</div>
              </div>
              <button className="resolve-btn" onClick={() => resolve(a.id)}>resolve</button>
            </div>
          ))}
        </div>
      ))}

      {(!alerts || alerts.length === 0) && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "#1e293b", fontSize: 12 }}>
          No open alerts — all systems normal
        </div>
      )}
    </div>
  );
}
