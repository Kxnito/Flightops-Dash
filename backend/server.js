import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const BBOX = { lamin: 24, lamax: 50, lomin: -125, lomax: -65 };

async function pollOpenSky() {
  try {
    const { data } = await axios.get(OPENSKY_URL, { params: BBOX, timeout: 10_000 });
    if (!data?.states) return;
    const rows = data.states.map((s) => ({
      icao24: s[0], callsign: s[1]?.trim() || null, origin_country: s[2],
      longitude: s[5], latitude: s[6], altitude_m: s[7],
      on_ground: s[8], velocity_ms: s[9], heading: s[10],
    }));
    if (rows.length === 0) return;
    await db.query(
      `INSERT INTO flight_states (icao24, callsign, origin_country, longitude, latitude, altitude_m, on_ground, velocity_ms, heading)
       SELECT * FROM unnest($1::varchar[],$2::varchar[],$3::varchar[],$4::decimal[],$5::decimal[],$6::decimal[],$7::boolean[],$8::decimal[],$9::decimal[])`,
      [rows.map(r=>r.icao24),rows.map(r=>r.callsign),rows.map(r=>r.origin_country),
       rows.map(r=>r.longitude),rows.map(r=>r.latitude),rows.map(r=>r.altitude_m),
       rows.map(r=>r.on_ground),rows.map(r=>r.velocity_ms),rows.map(r=>r.heading)]
    );
    await detectAnomalies(rows);
    console.log(`[${new Date().toISOString()}] Polled ${rows.length} flights`);
  } catch (err) {
    console.error("OpenSky poll failed:", err.message);
  }
}

async function detectAnomalies(rows) {
  for (const flight of rows) {
    if (!flight.callsign) continue;
    if (!flight.on_ground && flight.altitude_m !== null && flight.altitude_m < 900 && flight.altitude_m > 0) {
      await createAlert(flight.callsign, "critical", `Low altitude detected: ${Math.round(flight.altitude_m)}m`);
    }
    if (flight.velocity_ms !== null && flight.velocity_ms > 350) {
      await createAlert(flight.callsign, "warning", `Unusually high ground speed: ${Math.round(flight.velocity_ms)} m/s`);
    }
  }
}

async function createAlert(callsign, severity, message) {
  const existing = await db.query(
    `SELECT id FROM alerts WHERE callsign = $1 AND message = $2 AND created_at > NOW() - INTERVAL '10 minutes'`,
    [callsign, message]
  );
  if (existing.rowCount === 0) {
    await db.query(`INSERT INTO alerts (callsign, severity, message) VALUES ($1, $2, $3)`, [callsign, severity, message]);
  }
}

app.get("/api/flights", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM active_flights ORDER BY callsign`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/stats", async (req, res) => {
  try {
    const [flights, alerts, delays] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM active_flights`),
      db.query(`SELECT COUNT(*) AS total FROM alerts WHERE resolved = FALSE`),
      db.query(`SELECT ROUND(AVG(delay_minutes)) AS avg_delay FROM delay_events WHERE recorded_at > NOW() - INTERVAL '24 hours'`),
    ]);
    res.json({ activeFlights: parseInt(flights.rows[0].total), openAlerts: parseInt(alerts.rows[0].total), avgDelayMinutes: delays.rows[0].avg_delay ?? 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM alerts WHERE resolved = FALSE ORDER BY created_at DESC LIMIT 20`);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/alerts/:id/resolve", async (req, res) => {
  try {
    await db.query(`UPDATE alerts SET resolved = TRUE WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FlightOps API running on port ${PORT}`);
  pollOpenSky();
  setInterval(pollOpenSky, 30_000);
});

// Mock data fallback for when OpenSky is unavailable
async function seedMockData() {
  const mockFlights = [
    { icao24: "a1b2c3", callsign: "AA291", origin_country: "United States", longitude: -100.5, latitude: 38.2, altitude_m: 11000, on_ground: false, velocity_ms: 250, heading: 90 },
    { icao24: "d4e5f6", callsign: "UA884", origin_country: "United States", longitude: -95.3, latitude: 41.5, altitude_m: 10500, on_ground: false, velocity_ms: 240, heading: 45 },
    { icao24: "g7h8i9", callsign: "DL102", origin_country: "United States", longitude: -87.6, latitude: 35.8, altitude_m: 9800, on_ground: false, velocity_ms: 230, heading: 120 },
    { icao24: "j1k2l3", callsign: "WN445", origin_country: "United States", longitude: -112.0, latitude: 33.4, altitude_m: 11500, on_ground: false, velocity_ms: 255, heading: 270 },
    { icao24: "m4n5o6", callsign: "BA172", origin_country: "United Kingdom", longitude: -75.2, latitude: 42.1, altitude_m: 12000, on_ground: false, velocity_ms: 260, heading: 80 },
    { icao24: "p7q8r9", callsign: "AC881", origin_country: "Canada", longitude: -79.4, latitude: 43.6, altitude_m: 10000, on_ground: false, velocity_ms: 235, heading: 200 },
  ];

  for (const f of mockFlights) {
    await db.query(
      `INSERT INTO flight_states (icao24, callsign, origin_country, longitude, latitude, altitude_m, on_ground, velocity_ms, heading)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [f.icao24, f.callsign, f.origin_country, f.longitude, f.latitude, f.altitude_m, f.on_ground, f.velocity_ms, f.heading]
    );
  }
  console.log("Mock flight data seeded.");
}

seedMockData();
