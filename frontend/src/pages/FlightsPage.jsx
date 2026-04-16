import { useState, useMemo } from "react";

const msToKnots = (ms) => (ms ? Math.round(ms * 1.944) : "—");
const mToFt = (m) => (m ? Math.round(m * 3.281).toLocaleString() : "—");

const COLS = [
  { key: "callsign",        label: "Callsign",    width: "15%" },
  { key: "origin_country",  label: "Country",     width: "30%" },
  { key: "altitude_m",      label: "Altitude",    width: "20%" },
  { key: "velocity_ms",     label: "Speed (kts)", width: "20%" },
  { key: "heading",         label: "Heading",     width: "15%" },
];

export default function FlightsPage({ flights, loading }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("callsign");
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    if (!flights) return [];
    return flights
      .filter((f) => [f.callsign, f.origin_country].join(" ").toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        const va = a[sortKey] ?? ""; const vb = b[sortKey] ?? "";
        const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [flights, query, sortKey, sortDir]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Flights</h1>
        <p style={{ fontSize: 11, color: "#334155", marginTop: 4, letterSpacing: "0.05em" }}>{filtered.length.toLocaleString()} RESULTS</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>Active flights</div>
          <input type="text" placeholder="Search callsign or country..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <table style={{ opacity: loading ? 0.4 : 1, tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            {COLS.map((col) => <col key={col.key} style={{ width: col.width }} />)}
          </colgroup>
          <thead>
            <tr>
              {COLS.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={{ cursor: "pointer" }}>
                  {col.label}{sortKey === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.icao24}>
                <td style={{ color: "#38bdf8", fontWeight: 500 }}>{f.callsign ?? "—"}</td>
                <td>{f.origin_country ?? "—"}</td>
                <td>{mToFt(f.altitude_m)} ft</td>
                <td>{msToKnots(f.velocity_ms)}</td>
                <td>{f.heading != null ? `${Math.round(f.heading)}°` : "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#1e293b" }}>No flights found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
