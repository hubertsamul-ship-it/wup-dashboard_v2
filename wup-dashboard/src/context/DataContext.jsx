/**
 * DataContext — jedyne źródło danych dynamicznych aplikacji.
 * Pobiera dane z backendu FastAPI: GET /api/summary
 * (w trybie dev Vite proxy: localhost:5173/api → localhost:8000/api)
 *
 * Sekcje dashboard_final.json:
 *   pulpit       — KPI + trend 37m + mapa Mazowsza
 *   bezrobotni   — KPI + kategorie + charakterystyka D5
 *   stopa        — KPI + rankingi powiatów + trend 13m
 *   wynagrodzenia — dane ZUS
 *   powiaty_lista — 42 powiaty z trendem 13m (dla MapMazowieckie)
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function DataProvider({ children }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setData(null);
    setRetryKey(k => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchSummary() {
      try {
        const res = await fetch('/api/summary', { signal: controller.signal });
        if (!res.ok) throw new Error(`Serwer zwrócił błąd ${res.status}`);
        const d = await res.json();
        setData(d);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
    return () => controller.abort();
  }, [retryKey]);

  const value = {
    pulpit:            data?.pulpit            ?? null,
    bezrobotni:        data?.bezrobotni        ?? null,
    stopa:             data?.stopa             ?? null,
    wynagrodzenia:     data?.wynagrodzenia     ?? null,
    pracujacy:         data?.pracujacy         ?? null,
    wynagrodzenia_kpi: data?.wynagrodzenia_kpi ?? null,
    zwolnienia:        data?.zwolnienia        ?? null,
    powiaty:           data?.powiaty_lista     ?? [],
    loading,
    error,
    retry,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAppData = () => useContext(Ctx);
