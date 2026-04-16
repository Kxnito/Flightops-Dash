import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";

const API_BASE = "https://api.flightops-dashboard.xyz/api";
const SOCKET_URL = "https://api.flightops-dashboard.xyz";

const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"]
});

function useFetch(endpoint, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return { data, loading, error, refetch: fetchData };
}

export function useFlights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/flights`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    socket.on("flights", (flights) => {
      setData(flights);
      setLoading(false);
    });

    return () => socket.off("flights");
  }, []);

  return { data, loading };
}

export const useStats  = () => useFetch("/stats",  30000);
export const useAlerts = () => useFetch("/alerts", 15000);
