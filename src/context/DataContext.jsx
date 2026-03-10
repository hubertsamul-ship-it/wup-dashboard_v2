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

// Mock data for demo/preview mode
const MOCK_DATA = {
  pulpit: {
    bezr_razem: 98234,
    bezr_delta: -2345,
    bezr_pl: 798000,
    bezr_pl_delta: -12300,
    stopa_maz: 4.2,
    stopa_maz_delta: -0.1,
    stopa_pl: 5.1,
    trend_37m: Array.from({ length: 37 }, (_, i) => {
      const month = (i % 12) + 1;
      const year = 2023 + Math.floor(i / 12);
      const labels = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];
      return {
        label: `${labels[month-1]} ${year}`,
        bezr: 95000 + Math.sin(i * 0.3) * 8000 + Math.random() * 2000,
        stopa: 4.0 + Math.sin(i * 0.3) * 0.5 + Math.random() * 0.2
      };
    }),
    mapa_maz: [
      { wgm: "1465", nazwa: "m. st. Warszawa", stopa: 1.8 },
      { wgm: "1434", nazwa: "pruszkowski", stopa: 2.5 },
      { wgm: "1417", nazwa: "legionowski", stopa: 3.2 },
      { wgm: "1421", nazwa: "miński", stopa: 5.1 },
      { wgm: "1428", nazwa: "otwocki", stopa: 4.8 }
    ]
  },
  bezrobotni: {
    kpi: {
      ogolem: { value: 98234, delta: -2.3 },
      kobiety: { value: 52123, delta: -1.8 },
      mezczyzni: { value: 46111, delta: -2.9 },
      dlugotrwale: { value: 28456, delta: -3.1 }
    },
    kategorie: [
      { name: "Do 25 lat", value: 12500 },
      { name: "25-34 lata", value: 22300 },
      { name: "35-44 lata", value: 24100 },
      { name: "45-54 lata", value: 21800 },
      { name: "55+ lat", value: 17534 }
    ],
    charakterystyka: {
      wyksztalcenie: [
        { name: "Wyższe", value: 18500 },
        { name: "Średnie", value: 32400 },
        { name: "Zasadnicze", value: 28300 },
        { name: "Podstawowe", value: 19034 }
      ]
    }
  },
  stopa: {
    kpi: {
      maz: { value: 4.2, delta: -0.1 },
      pl: { value: 5.1, delta: -0.2 },
      najnizsza: { value: 1.8, powiat: "Warszawa" },
      najwyzsza: { value: 12.3, powiat: "szydłowiecki" }
    },
    ranking_top: [
      { nazwa: "m. st. Warszawa", stopa: 1.8 },
      { nazwa: "pruszkowski", stopa: 2.5 },
      { nazwa: "piaseczyński", stopa: 2.8 },
      { nazwa: "legionowski", stopa: 3.2 },
      { nazwa: "grodziski", stopa: 3.5 }
    ],
    ranking_bottom: [
      { nazwa: "szydłowiecki", stopa: 12.3 },
      { nazwa: "radomski", stopa: 10.8 },
      { nazwa: "przysuski", stopa: 9.5 },
      { nazwa: "lipski", stopa: 8.9 },
      { nazwa: "zwoleński", stopa: 8.2 }
    ],
    trend_13m: Array.from({ length: 13 }, (_, i) => ({
      date: `2024-${String((i % 12) + 1).padStart(2, '0')}`,
      maz: 4.0 + Math.random() * 0.5,
      pl: 4.8 + Math.random() * 0.6
    }))
  },
  wynagrodzenia: {
    przecietne_maz: 8234,
    przecietne_pl: 7456,
    mediana_maz: 6890,
    trend: Array.from({ length: 12 }, (_, i) => ({
      date: `2024-${String(i + 1).padStart(2, '0')}`,
      value: 7800 + i * 50 + Math.random() * 200
    }))
  },
  pracujacy: {
    kpi: {
      ogolem: { value: 2456000, delta: 1.2 },
      sektor_prywatny: { value: 1890000, delta: 1.5 },
      sektor_publiczny: { value: 566000, delta: 0.3 }
    }
  },
  wynagrodzenia_kpi: {
    przecietne: { value: 8234, delta: 5.2 },
    mediana: { value: 6890, delta: 4.8 }
  },
  zwolnienia: {
    grupowe: 12,
    indywidualne: 3456,
    planowane: 890
  },
  powiaty_lista: [
    { wgm: "1465", nazwa: "m. st. Warszawa", stopa: 1.8, bezrobotni: 28500, trend: Array.from({length: 13}, () => 1.6 + Math.random() * 0.4) },
    { wgm: "1434", nazwa: "pruszkowski", stopa: 2.5, bezrobotni: 2100, trend: Array.from({length: 13}, () => 2.3 + Math.random() * 0.4) },
    { wgm: "1429", nazwa: "piaseczyński", stopa: 2.8, bezrobotni: 2800, trend: Array.from({length: 13}, () => 2.6 + Math.random() * 0.4) },
    { wgm: "1417", nazwa: "legionowski", stopa: 3.2, bezrobotni: 1900, trend: Array.from({length: 13}, () => 3.0 + Math.random() * 0.4) },
    { wgm: "1408", nazwa: "grodziski", stopa: 3.5, bezrobotni: 1600, trend: Array.from({length: 13}, () => 3.3 + Math.random() * 0.4) },
    { wgm: "1421", nazwa: "miński", stopa: 5.1, bezrobotni: 3200, trend: Array.from({length: 13}, () => 4.9 + Math.random() * 0.4) },
    { wgm: "1428", nazwa: "otwocki", stopa: 4.8, bezrobotni: 2400, trend: Array.from({length: 13}, () => 4.6 + Math.random() * 0.4) },
    { wgm: "1463", nazwa: "m. Radom", stopa: 8.2, bezrobotni: 8900, trend: Array.from({length: 13}, () => 8.0 + Math.random() * 0.4) },
    { wgm: "1462", nazwa: "m. Płock", stopa: 6.1, bezrobotni: 4200, trend: Array.from({length: 13}, () => 5.9 + Math.random() * 0.4) },
    { wgm: "1461", nazwa: "m. Ostrołęka", stopa: 7.5, bezrobotni: 2100, trend: Array.from({length: 13}, () => 7.3 + Math.random() * 0.4) }
  ]
};

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
        // Use mock data in preview/demo mode
        if (e.name !== 'AbortError') {
          console.log('[v0] Using mock data for preview mode');
          setData(MOCK_DATA);
        }
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
