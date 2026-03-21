import { useMemo, useState } from 'react';
import Card from './Card';

function std(values = []) {
  if (!values.length) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function buildRanking(id, nazwa, opis, itemsRaw, calcValue, trendFn) {
  const items = itemsRaw
    .map((p) => {
      const value = calcValue(p);
      if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return null;
      return {
        id: `${id}-${p.wgm}`,
        kod_teryt: p.wgm,
        nazwa: p.nazwa,
        wartosc_punktowa: Number(value),
        trend: trendFn ? trendFn(p, value) : 'stabilny',
      };
    })
    .filter(Boolean);

  return { id, nazwa, opis, items };
}

function normalizePercent(v, min, max) {
  if (max === min) return 50;
  return ((v - min) / (max - min)) * 100;
}

function minMaxScores(values = [], invert = false) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 1);
  return values.map((v) => {
    const score = (v - min) / (max - min);
    return invert ? 1 - score : score;
  });
}

function RankingCard({ ranking, sortDir, onToggleSort }) {
  const sorted = useMemo(() => {
    const arr = [...ranking.items];
    arr.sort((a, b) => sortDir === 'desc'
      ? b.wartosc_punktowa - a.wartosc_punktowa
      : a.wartosc_punktowa - b.wartosc_punktowa
    );
    return arr;
  }, [ranking.items, sortDir]);

  const values = sorted.map((x) => x.wartosc_punktowa);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <Card
      title={ranking.nazwa}
      badge={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            title={ranking.opis}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: 999,
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              fontSize: '0.70rem',
              cursor: 'help',
              userSelect: 'none',
            }}
            aria-label={`Metodologia: ${ranking.opis}`}
          >
            i
          </span>
          <button
            onClick={onToggleSort}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg3)',
              color: 'var(--muted)',
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: '0.68rem',
              cursor: 'pointer',
            }}
          >
            Sort: {sortDir === 'desc' ? 'Malejąco' : 'Rosnąco'}
          </button>
        </div>
      }
      style={{ minHeight: 340 }}
    >
      <div
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          padding: '10px 16px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {sorted.map((row, idx) => {
          const width = Math.max(8, normalizePercent(row.wartosc_punktowa, min, max));
          return (
            <div key={row.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {idx + 1}. {row.nazwa}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.73rem', color: '#60a5fa' }}>
                  {row.wartosc_punktowa.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  width: '82%',
                  margin: '6px auto 0',
                  height: 10,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 999,
                  padding: 1,
                }}
              >
                <div
                  style={{
                    width: `${width}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #4895ef, #1f6feb)',
                  }}
                  title={`Trend: ${row.trend}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function MarketRankingsPanel({ powiaty = [] }) {
  const [sortMap, setSortMap] = useState({});
  const setToggle = (id) => () => {
    setSortMap((prev) => ({ ...prev, [id]: prev[id] === 'asc' ? 'desc' : 'asc' }));
  };

  const rankings = useMemo(() => {
    if (!powiaty?.length) return [];

    const base = powiaty.filter((p) => p && p.bezr_razem > 0);

    const lmrCandidates = base.filter((p) => p.wyn_brutto != null && p.stopa != null);
    let lmrRanking = null;
    if (lmrCandidates.length > 0) {
      const stopaScores = minMaxScores(lmrCandidates.map((p) => p.stopa), true);
      const vuScores = minMaxScores(lmrCandidates.map((p) => (p.bezr_razem > 0 ? p.oferty_pracy / p.bezr_razem : 0)));
      const youthScores = minMaxScores(lmrCandidates.map((p) => {
        const cat = (p.kategorie || []).find((k) => (k.label || '').toLowerCase().includes('do 30'));
        const youthCount = cat?.n || 0;
        return p.bezr_razem > 0 ? youthCount / p.bezr_razem : 0;
      }), true);
      const wageScores = minMaxScores(lmrCandidates.map((p) => p.wyn_brutto));

      lmrRanking = {
        id: 'lmr',
        nazwa: 'Ranking odporności rynku (LMR)',
        opis: 'Syntetyczny score 0-100: stopa (40%), V/U (20%), młodzi (10%), płace (30%)',
        items: lmrCandidates.map((p, idx) => ({
          id: `lmr-${p.wgm}`,
          kod_teryt: p.wgm,
          nazwa: p.nazwa,
          wartosc_punktowa: (stopaScores[idx] * 0.4 + vuScores[idx] * 0.2 + youthScores[idx] * 0.1 + wageScores[idx] * 0.3) * 100,
          trend: p.stopa_delta != null
            ? (p.stopa_delta > 0 ? 'spadek' : p.stopa_delta < 0 ? 'wzrost' : 'stabilny')
            : 'stabilny',
        })),
      };
    }

    const r1 = buildRanking(
      'chlonnosc',
      'Wskaźnik Chłonności Rynku',
      '(Oferty pracy / Napływ bezrobotnych) * 100',
      base,
      (p) => (p.zarej_razem > 0 ? (p.oferty_pracy / p.zarej_razem) * 100 : null),
      (p) => (p.oferty_delta > 0 ? 'wzrost' : p.oferty_delta < 0 ? 'spadek' : 'stabilny')
    );

    const r2 = buildRanking(
      'sezonowosc',
      'Indeks Odporności Sezonowej',
      '1 / odchylenie standardowe stopy bezrobocia (13m w snapshotcie)',
      base,
      (p) => {
        const s = std((p.trend_stopa_13m || []).filter((x) => x != null));
        return s && s > 0 ? 1 / s : null;
      },
      () => 'stabilny'
    );

    const r3 = buildRanking(
      'reintegracja',
      'Dynamika Reintegracji',
      '(Odpływ z powodu pracy / Liczba bezrobotnych) * 100',
      base,
      (p) => (p.bezr_razem > 0 ? (p.podjeli_prace / p.bezr_razem) * 100 : null),
      (p) => (p.wyrej_delta > 0 ? 'wzrost' : p.wyrej_delta < 0 ? 'spadek' : 'stabilny')
    );

    const r4 = buildRanking(
      'presja_placowa',
      'Wskaźnik Presji Płacowej',
      'Średnie wynagrodzenie / (Stopa bezrobocia + 1)',
      base.filter((p) => p.wyn_brutto != null && p.stopa != null),
      (p) => p.wyn_brutto / (p.stopa + 1),
      () => 'stabilny'
    );

    const r5 = buildRanking(
      'rotacja',
      'Współczynnik Rotacji (Churn)',
      '(Napływ + Odpływ) / Liczba pracujących',
      base.filter((p) => p.wyn_pracujacy > 0),
      (p) => (p.zarej_razem + p.wyrej_razem) / p.wyn_pracujacy,
      () => 'stabilny'
    );

    // Vitality Business Index pomijamy — brak REGON/mieszkańców w snapshotcie.
    return [lmrRanking, r1, r2, r3, r4, r5].filter((r) => r && r.items.length > 0);
  }, [powiaty]);

  if (!rankings.length) {
    return (
      <Card title="Rankingi rynku pracy" badge="Brak danych">
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Brakuje danych wymaganych do wyliczenia rankingów syntetycznych.
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
      {rankings.map((ranking) => (
        <RankingCard
          key={ranking.id}
          ranking={ranking}
          sortDir={sortMap[ranking.id] || 'desc'}
          onToggleSort={setToggle(ranking.id)}
        />
      ))}
    </div>
  );
}
