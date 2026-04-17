import FlightMap from "../components/FlightMap";

export default function MapPage({ flights }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>Live Map</h1>
        <p style={{ fontSize: 11, color: "#334155", marginTop: 4, letterSpacing: "0.05em" }}>
          {flights?.length?.toLocaleString() ?? "—"} AIRCRAFT · USE FLIGHTS TAB TO FILTER BY CALLSIGN OR COUNTRY
        </p>
      </div>
      <div style={{ flex: 1, minHeight: 500, borderRadius: 10, overflow: "hidden", border: "0.5px solid #1e293b" }}>
        <FlightMap flights={flights} />
      </div>
    </div>
  );
}
