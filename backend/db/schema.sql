CREATE TABLE flight_states (
  id           SERIAL PRIMARY KEY,
  icao24       VARCHAR(10)    NOT NULL,
  callsign     VARCHAR(20),
  origin_country VARCHAR(60),
  longitude    DECIMAL(10, 6),
  latitude     DECIMAL(10, 6),
  altitude_m   DECIMAL(10, 2),
  velocity_ms  DECIMAL(8, 2),
  heading      DECIMAL(6, 2),
  on_ground    BOOLEAN        NOT NULL DEFAULT FALSE,
  polled_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flight_callsign  ON flight_states (callsign);
CREATE INDEX idx_flight_polled_at ON flight_states (polled_at DESC);
CREATE INDEX idx_flight_icao24    ON flight_states (icao24);

CREATE TABLE delay_events (
  id           SERIAL PRIMARY KEY,
  callsign     VARCHAR(20)    NOT NULL,
  origin       CHAR(4),
  destination  CHAR(4),
  delay_minutes INT           NOT NULL,
  reason       VARCHAR(255),
  recorded_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id           SERIAL PRIMARY KEY,
  callsign     VARCHAR(20),
  severity     VARCHAR(10)   NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message      TEXT          NOT NULL,
  resolved     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_resolved ON alerts (resolved, created_at DESC);

CREATE VIEW active_flights AS
SELECT DISTINCT ON (icao24)
  icao24, callsign, origin_country,
  longitude, latitude, altitude_m,
  velocity_ms, heading, on_ground, polled_at
FROM flight_states
WHERE polled_at > NOW() - INTERVAL '5 minutes'
  AND on_ground = FALSE
ORDER BY icao24, polled_at DESC;
