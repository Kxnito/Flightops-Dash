export default function StatsBar({ stats, loading }) {
  const cards = [
    { label: "Active flights", value: stats?.activeFlights?.toLocaleString() ?? "—" },
    { label: "Avg delay", value: stats?.avgDelayMinutes ? `${stats.avgDelayMinutes} min` : "—" },
    { label: "Open alerts", value: stats?.openAlerts ?? "—", highlight: stats?.openAlerts > 0 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {cards.map((card) => (
        <div key={card.label} style={{ background: "#f0f0f0", borderRadius: 8, padding: "12px 16px", opacity: loading ? 0.5 : 1 }}>
          <p style={{ fontSize: 12, color: "#666", marginBottom: 4, margin: 0 }}>{card.label}</p>
          <p style={{ fontSize: 24, fontWeight: 500, color: card.highlight ? "red" : "#111", margin: 0 }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
