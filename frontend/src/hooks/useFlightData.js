import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom plane icon rotated to match heading
function planeIcon(heading) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 20px;
      height: 20px;
      transform: rotate(${heading}deg);
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
    ">✈</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function msToKnots(ms) {
  return ms ? Math.round(ms * 1.944) : 0;
}

function mToFt(m) {
  return m ? Math.round(m * 3.281).toLocaleString() : 0;
}

export default function FlightMap({ flights }) {
  if (!flights || flights.length === 0) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-tertiary)",
        fontSize: 13,
        background: "var(--color-background-secondary)",
        borderRadius: 8,
      }}>
        No flight data available
      </div>
    );
  }

  const validFlights = flights.filter(
    (f) => f.latitude != null && f.longitude != null
  );

  return (
    <div style={{ height: "100%", borderRadius: 8, overflow: "hidden" }}>
      <MapContainer
        center={[39, -98]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validFlights.map((flight) => (
          <Marker
            key={flight.icao24}
            position={[flight.latitude, flight.longitude]}
            icon={planeIcon(flight.heading ?? 0)}
          >
            <Popup>
              <strong>{flight.callsign ?? "Unknown"}</strong><br />
              {flight.origin_country}<br />
              Altitude: {mToFt(flight.altitude_m)} ft<br />
              Speed: {msToKnots(flight.velocity_ms)} kts<br />
              Heading: {flight.heading != null ? `${Math.round(flight.heading)}°` : "—"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export const useFlightHistory = () => useFetch("/flights/history", 300000);