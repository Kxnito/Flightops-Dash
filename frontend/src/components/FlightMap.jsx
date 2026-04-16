import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function planeIcon(heading) {
  return L.divIcon({
    className: "",
    html: `<div style="width:20px;height:20px;transform:rotate(${heading}deg);font-size:16px;line-height:20px;text-align:center;">✈</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const msToKnots = (ms) => (ms ? Math.round(ms * 1.944) : 0);
const mToFt = (m) => (m ? Math.round(m * 3.281).toLocaleString() : 0);

export default function FlightMap({ flights }) {
  if (!flights || flights.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 12, background: "#0f172a" }}>
        No flight data available
      </div>
    );
  }

  const validFlights = flights.filter((f) => f.latitude != null && f.longitude != null);

  return (
    <div style={{ height: "100%" }}>
      <MapContainer center={[39, -98]} zoom={4} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />
        {validFlights.map((flight) => (
          <Marker key={flight.icao24} position={[flight.latitude, flight.longitude]} icon={planeIcon(flight.heading ?? 0)}>
            <Popup>
              <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.6 }}>
                <strong style={{ color: "#38bdf8" }}>{flight.callsign ?? "Unknown"}</strong><br />
                {flight.origin_country}<br />
                Alt: {mToFt(flight.altitude_m)} ft<br />
                Spd: {msToKnots(flight.velocity_ms)} kts<br />
                Hdg: {flight.heading != null ? `${Math.round(flight.heading)}°` : "—"}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
