import { useState } from "react";
import { useFlights, useStats, useAlerts } from "./hooks/useFlightData";
import DashboardPage from "./pages/DashboardPage";
import FlightsPage from "./pages/FlightsPage";
import AlertsPage from "./pages/AlertsPage";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "flights",   label: "Flights",   icon: "✈" },
  { id: "alerts",    label: "Alerts",    icon: "⚠" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const { data: flights, loading: lFlights } = useFlights();
  const { data: stats,   loading: lStats   } = useStats();
  const { data: alerts,  loading: lAlerts, refetch } = useAlerts();

  const unresolved = alerts?.length ?? 0;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0e17", fontFamily: "'DM Mono', 'Courier New', monospace", color: "#e2e8f0", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0e17; }
        ::-webkit-scrollbar-thumb { background: #2a3a5c; border-radius: 2px; }
        .nav-btn { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border: none; background: none; color: #64748b; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; width: 100%; text-align: left; border-left: 2px solid transparent; transition: all 0.15s; letter-spacing: 0.05em; }
        .nav-btn:hover { color: #94a3b8; background: rgba(255,255,255,0.03); }
        .nav-btn.active { color: #38bdf8; border-left-color: #38bdf8; background: rgba(56,189,248,0.06); }
        .page { flex: 1; overflow-y: auto; padding: 28px 32px; }
        .stat-card { background: #111827; border: 0.5px solid #1e293b; border-radius: 8px; padding: 16px 20px; }
        .stat-label { font-size: 10px; color: #475569; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
        .stat-value { font-size: 28px; font-weight: 500; color: #f1f5f9; font-family: 'Syne', sans-serif; }
        .stat-sub { font-size: 11px; color: #334155; margin-top: 4px; }
        .section-title { font-size: 10px; color: #334155; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 16px; font-family: 'DM Mono', monospace; }
        .card { background: #111827; border: 0.5px solid #1e293b; border-radius: 10px; padding: 20px; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; display: inline-block; animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { text-align: left; padding: 8px 12px; color: #334155; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 0.5px solid #1e293b; font-weight: 400; }
        td { padding: 8px 12px; border-bottom: 0.5px solid #0f172a; color: #94a3b8; }
        tr:hover td { background: rgba(255,255,255,0.02); }
        .badge { font-size: 10px; padding: 2px 8px; border-radius: 99px; }
        .badge-green { background: rgba(34,197,94,0.1); color: #22c55e; }
        .badge-red { background: rgba(239,68,68,0.1); color: #ef4444; }
        .badge-yellow { background: rgba(234,179,8,0.1); color: #eab308; }
        input[type=text] { background: #0f172a; border: 0.5px solid #1e293b; border-radius: 6px; color: #94a3b8; font-family: 'DM Mono', monospace; font-size: 12px; padding: 7px 12px; outline: none; width: 220px; }
        input[type=text]:focus { border-color: #38bdf8; }
        button.resolve-btn { background: none; border: 0.5px solid #1e293b; border-radius: 4px; color: #475569; font-size: 10px; padding: 3px 8px; cursor: pointer; font-family: 'DM Mono', monospace; letter-spacing: 0.05em; }
        button.resolve-btn:hover { border-color: #38bdf8; color: #38bdf8; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 200, background: "#080c14", borderRight: "0.5px solid #1e293b", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 16px 20px", borderBottom: "0.5px solid #1e293b" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>FlightOps</div>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: "0.1em", marginTop: 2 }}>OPERATIONS CENTER</div>
        </div>

        <div style={{ padding: "12px 0", flex: 1 }}>
          {NAV.map((n) => (
            <button key={n.id} className={`nav-btn${page === n.id ? " active" : ""}`} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              {n.label}
              {n.id === "alerts" && unresolved > 0 && (
                <span style={{ marginLeft: "auto", background: "#ef4444", color: "white", fontSize: 9, padding: "1px 5px", borderRadius: 99 }}>{unresolved}</span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "0.5px solid #1e293b", fontSize: 10, color: "#1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot" />
            <span style={{ color: "#334155" }}>LIVE · OpenSky</span>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="page">
        {page === "dashboard" && <DashboardPage stats={stats} flights={flights} alerts={alerts} loading={lStats} />}
        {page === "flights"   && <FlightsPage flights={flights} loading={lFlights} />}
        {page === "alerts"    && <AlertsPage alerts={alerts} loading={lAlerts} onResolve={refetch} />}
      </div>
    </div>
  );
}
