import { useFlights, useStats, useAlerts } from "./hooks/useFlightData";
import StatsBar from "./components/StatsBar";
import FlightTable from "./components/FlightTable";
import AlertPanel from "./components/AlertPanel";

export default function App() {
  const { data: flights, loading: lFlights } = useFlights();
  const { data: stats, loading: lStats } = useStats();
  const { data: alerts, loading: lAlerts, refetch } = useAlerts();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gridTemplateRows: "auto auto 1fr", gap: 16, padding: 20, minHeight: "100vh", background: "#f5f5f5", fontFamily: "sans-serif" }}>
      <header style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>FlightOps Dashboard</h1>
          <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Live data via OpenSky Network · refreshes every 30s</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#639922", display: "inline-block" }} />
          Live
        </div>
      </header>
      <div style={{ gridColumn: "1 / -1" }}>
        <StatsBar stats={stats} loading={lStats} />
      </div>
      <main style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 12, padding: 16 }}>
        <FlightTable flights={flights} loading={lFlights} />
      </main>
      <aside style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 12, padding: 16 }}>
        <AlertPanel alerts={alerts} loading={lAlerts} onResolve={refetch} />
      </aside>
    </div>
  );
}
