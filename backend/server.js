import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";
import axios from "axios";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const OPENSKY_URL = "https://opensky-network.org/api/states/all";
const BBOX = { lamin: 24, lamax: 50, lomin: -125, lomax: -65 };
const TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";

let accessToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  try {
    const res = await axios.post(TOKEN_URL,
      new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.OPENSKY_CLIENT_ID, client_secret: process.env.OPENSKY_CLIENT_SECRET }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    accessToken = res.data.access_token;
    tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
    console.log("Got new OpenSky token");
    return accessToken;
  } catch (err) {
    console.error("Token fetch failed:", err.message);
    return null;
  }
}

async function pollOpenSky() {
  try {
    const token = await getToken();
    if (!token) return;
    const { data } = await axios.get(OPENSKY_URL, { params: BBOX, timeout: 10_000, headers: { Authorization: `Bearer ${token}` } });
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
    const airborne = rows.filter(r => !r.on_ground && r.latitude && r.longitude);
    io.emit("flights", airborne);
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
    const result = await db.query(
      `INSERT INTO alerts (callsign, severity, message) VALUES ($1, $2, $3) RETURNING *`,
      [callsign, severity, message]
    );
    io.emit("alert", result.rows[0]);
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

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

async function autoResolveOldAlerts() {
  await db.query(
    `UPDATE alerts SET resolved = TRUE 
     WHERE resolved = FALSE 
     AND created_at < NOW() - INTERVAL '1 hour'`
  );
}

async function checkDelays() {
  console.log("Checking delays...");
  try {
    const { rows: flights } = await db.query(
      `SELECT DISTINCT callsign FROM active_flights WHERE callsign IS NOT NULL LIMIT 10`
    );
    
    for (const flight of flights) {
      const res = await axios.get("http://api.aviationstack.com/v1/flights", {
        params: {
          access_key: process.env.AVIATIONSTACK_KEY,
          flight_iata: flight.callsign.trim(),
          limit: 1,
        },
        timeout: 10_000,
      });

      const data = res.data?.data?.[0];
      console.log("AviationStack response:", JSON.stringify(res.data?.data?.[0]));
      if (!data) continue;

      const arrival = data.arrival;
      if (!arrival?.estimated || !arrival?.scheduled) continue;

      const scheduled = new Date(arrival.scheduled);
      const estimated = new Date(arrival.estimated);
      const delayMinutes = Math.round((estimated - scheduled) / 60000);

      if (delayMinutes > 0) {
        await db.query(
          `INSERT INTO delay_events (callsign, origin, destination, delay_minutes, reason)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [
            flight.callsign,
            data.departure?.iata ?? null,
            data.arrival?.iata ?? null,
            delayMinutes,
            data.flight_status ?? "unknown",
          ]
        );
        console.log(`Delay recorded: ${flight.callsign} +${delayMinutes}min`);
      }
    }
  } catch (err) {
    console.error("Delay check failed:", err.message);
  }
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`FlightOps API running on port ${PORT}`);
  pollOpenSky();
  checkDelays();
  autoResolveOldAlerts();
  setInterval(pollOpenSky, 30_000);
  setInterval(checkDelays, 300_000);
  setInterval(autoResolveOldAlerts, 60_000); // runs every minute
});