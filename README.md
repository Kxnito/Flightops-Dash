# FlightOps Dashboard

A full-stack real-time flight operations dashboard that tracks live aircraft across North American airspace. Built with React, Node.js, PostgreSQL, and deployed on a Raspberry Pi 5.

**Live demo:** https://flightops-dash.vercel.app  
**API:** https://api.flightops-dashboard.xyz

---

## Features

- **Live flight tracking** — polls the OpenSky Network API every 30 seconds via OAuth2, aggregating 4,000+ aircraft state vectors across North America
- **Interactive map** — Leaflet.js map with plane icons rotated to match heading, filtered by search query in real time
- **Flight table** — searchable, sortable, paginated list of all active flights
- **Anomaly detection** — automatically flags low-altitude and high-speed flights with severity-based alerts
- **Delay tracking** — detects flights with extended airborne duration and records delay events
- **Historical chart** — area chart showing flight activity over the last 24 hours
- **Alert management** — grouped alerts by severity with one-click resolve and auto-resolution after 1 hour
- **Dark aerospace UI** — multi-page dashboard with sidebar navigation

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Mapping | Leaflet.js + react-leaflet |
| Charts | Recharts |
| Backend | Node.js + Express |
| Database | PostgreSQL (Neon) |
| Data source | OpenSky Network API (OAuth2) |
| Tunnel | Cloudflare Tunnel |
| Frontend hosting | Vercel |
| Hardware | Raspberry Pi 5 (8GB) |

---

## Architecture

```
OpenSky Network API (OAuth2)
        │
        ▼
Raspberry Pi 5 (home server)
  Node.js / Express backend
  Anomaly detection engine
  Delay calculation engine
        │
        ▼
Cloudflare Tunnel
  api.flightops-dashboard.xyz
        │
        ▼
Neon (cloud PostgreSQL)
        │
        ▼
Vercel (React frontend)
  flightops-dash.vercel.app
```

---

## Project structure

```
Flightops-Dash/
├── backend/
│   ├── db/
│   │   └── schema.sql        Database schema and indexes
│   ├── server.js             Express API, OpenSky poller, anomaly detection
│   └── package.json
└── frontend/
    └── src/
        ├── components/
        │   └── FlightMap.jsx         Leaflet map component
        ├── hooks/
        │   └── useFlightData.js      Custom hooks for API fetching
        ├── pages/
        │   ├── DashboardPage.jsx     Overview with stats and chart
        │   ├── FlightsPage.jsx       Map and paginated flight table
        │   └── AlertsPage.jsx        Alert management
        └── App.jsx                   Root component with sidebar nav
```

---

## Setup

### Prerequisites

- Node.js v20+
- PostgreSQL database (Neon recommended — free tier available)
- OpenSky Network account with API client credentials

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENSKY_CLIENT_ID=your_client_id
OPENSKY_CLIENT_SECRET=your_client_secret
PORT=3001
```

Run the database schema:

```bash
psql $DATABASE_URL < db/schema.sql
```

Start the server:

```bash
node server.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/flights | All active airborne flights |
| GET | /api/stats | Summary stats |
| GET | /api/flights/history | Hourly flight counts (last 24h) |
| GET | /api/alerts | Unresolved alerts |
| PATCH | /api/alerts/:id/resolve | Resolve an alert |

---

## License

MIT