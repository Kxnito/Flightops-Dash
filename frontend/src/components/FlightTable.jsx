import { useState, useMemo } from "react";

const msToKnots = (ms) => (ms ? Math.round(ms * 1.944) : "—");
const mToFt = (m) => (m ? Math.round(m * 3.281).toLocaleString() : "—");

export default function FlightTable({ flights, loading }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!flights) return [];
    return flights.filter((f) =>
      [f.callsign, f.origin_country].join(" ").toLowerCase().includes(query.toLowerCase())
    );
  }, [flights, query]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Active flights</h2>
        <input type="text" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ fontSize: 13, padding: "4px 10px", width: 200 }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, opacity: loading ? 0.4 : 1 }}>
        <thead>
          <tr>
            {["Callsign", "Country", "Altitude", "Speed (kts)", "Heading"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #eee", color: "#666", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((f) => (
            <tr key={f.icao24} style={{ borderBottom: "0.5px solid #f0f0f0" }}>
              <td style={{ padding: "7px 10px", fontWeight: 500 }}>{f.callsign ?? "—"}</td>
              <td style={{ padding: "7px 10px", color: "#666" }}>{f.origin_country ?? "—"}</td>
              <td style={{ padding: "7px 10px" }}>{mToFt(f.altitude_m)} ft</td>
              <td style={{ padding: "7px 10px" }}>{msToKnots(f.velocity_ms)}</td>
              <td style={{ padding: "7px 10px" }}>{f.heading != null ? `${Math.round(f.heading)}°` : "—"}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#aaa" }}>No flights found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
