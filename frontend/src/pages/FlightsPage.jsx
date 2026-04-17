import { useState, useMemo } from "react";
import FlightMap from "../components/FlightMap";

const msToKnots = (ms) => (ms ? Math.round(ms * 1.944) : "—");
const mToFt = (m) => (m ? Math.round(m * 3.281).toLocaleString() : "—");
const PER_PAGE = 25;

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
  const [page, setPage] = useState(1);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const mapFlights = query.length > 0 ? filtered : flights;

  function handleSearch(val) {
    setQuery(val);
    setPage(1);
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Flights</h1>
        <p style={{ fontSize: 11, color: "#334155", marginTop: 4, letterSpacing: "0.05em" }}>
          {filtered.length.toLocaleString()} RESULTS · {query ? "FILTERED" : "ALL AIRCRAFT"}
        </p>
      </div>

      {/* Map — always visible, filters with search */}
      <div style={{ height: 350, borderRadius: 10, overflow: "hidden", border: "0.5px solid #1e293b", marginBottom: 16 }}>
        <FlightMap flights={mapFlights} />
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="section-title" style={{ margin: 0 }}>Active flights</div>
          <input
            type="text"
            placeholder="Search callsign or country..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
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
            {paged.map((f) => (
              <tr key={f.icao24}>
                <td style={{ color: "#38bdf8", fontWeight: 500 }}>{f.callsign ?? "—"}</td>
                <td>{f.origin_country ?? "—"}</td>
                <td>{mToFt(f.altitude_m)} ft</td>
                <td>{msToKnots(f.velocity_ms)}</td>
                <td>{f.heading != null ? `${Math.round(f.heading)}°` : "—"}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#1e293b" }}>No flights found</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "8px 0" }}>
          <span style={{ fontSize: 11, color: "#334155" }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="resolve-btn" onClick={() => setPage(1)} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>first</button>
            <button className="resolve-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ opacity: currentPage === 1 ? 0.3 : 1 }}>prev</button>
            <button className="resolve-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>next</button>
            <button className="resolve-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}>last</button>
          </div>
        </div>
      </div>
    </div>
  );
}