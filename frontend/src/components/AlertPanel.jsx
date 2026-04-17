const API_BASE = import.meta.env.VITE_API_URL || "https://api.flightops-dashboard.xyz/api";
const API_KEY = import.meta.env.VITE_API_KEY || "";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function AlertPanel({ alerts, loading, onResolve }) {
  async function resolveAlert(id) {
    await fetch(`${API_BASE}/alerts/${id}/resolve`, {
      method: "PATCH",
      headers: API_KEY ? { "x-api-key": API_KEY } : {},
    });
    onResolve();
  }

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>System alerts</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: loading ? 0.4 : 1 }}>
        {alerts?.length === 0 && <p style={{ fontSize: 13, color: "#aaa" }}>No open alerts.</p>}
        {alerts?.map((alert) => (
          <div key={alert.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", background: "#f9f9f9", borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, margin: 0 }}><strong>{alert.callsign} — </strong>{alert.message}</p>
              <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>{timeAgo(alert.created_at)}</p>
            </div>
            <button onClick={() => resolveAlert(alert.id)} style={{ fontSize: 11, padding: "2px 8px", cursor: "pointer" }}>Resolve</button>
          </div>
        ))}
      </div>
    </div>
  );
}
