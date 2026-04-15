import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://uncolored-urgency-silo.ngrok-free.dev/api";

function useFetch(endpoint, intervalMs = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
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

export const useFlights = () => useFetch("/flights", 30000);
export const useStats = () => useFetch("/stats", 30000);
export const useAlerts = () => useFetch("/alerts", 15000);
