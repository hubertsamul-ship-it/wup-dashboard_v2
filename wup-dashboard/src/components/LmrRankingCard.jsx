import { useMemo, useState } from 'react';
import Card from './Card';

function minMax(values, invert = false) {
  if (!values?.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = (max - min) || 1;
  const out = values.map(v => (v - min) / span);
  return invert ? out.map(v => 1 - v) : out;
}

function computeLmr(powiaty = []) {
  const getYouthCount = (p) => {
    if (p?.do_30 != null) return Number(p.do_30);
    const cats = p?.kategorie || [];
    const row = cats.find(c => (c?.label || '').toLowerCase().includes('do 30'));
    return row?.n != null ? Number(row.n) : null;
  };

  const rows = (powiaty || []).filter(p =>
    p && p.bezr_razem > 0 &&
    p.stopa != null &&
    p.oferty_pracy != null &&
    p.wyn_brutto != null
  ).map(p => {
    const youth = getYouthCount(p);
    return ({
    kod_teryt: p.wgm,
    nazwa: p.nazwa,
    stopa_pct: Number(p.stopa),
    vu_ratio: Number(p.oferty_pracy) / Number(p.bezr_razem),
    youth_share: youth != null ? Number(youth) / Number(p.bezr_razem) : null,
    avg_wage: Number(p.wyn_brutto),
    bezr_razem: Number(p.bezr_razem),
    oferty_pracy: Number(p.oferty_pracy),
  });
  }).filter(r => r.youth_share != null);

  const nStopa = minMax(rows.map(r => r.stopa_pct), true);
  const nVu = minMax(rows.map(r => r.vu_ratio), false);
  const nYouth = minMax(rows.map(r => r.youth_share), true);
  const nWage = minMax(rows.map(r => r.avg_wage), false);

  const weighted = rows.map((r, i) => {
    const score = (nStopa[i] * 0.4 + nVu[i] * 0.2 + nYouth[i] * 0.1 + nWage[i] * 0.3) * 100;
    const tags = [];
    if (nWage[i] > 0.8) tags.push('Lider Płacowy');
    if (nVu[i] > 0.8) tags.push('Rynek Pracownika');
    return {
      ...r,
      n_stopa: nStopa[i],
      n_vu: nVu[i],
      n_youth: nYouth[i],
      n_wage: nWage[i],
      lmr_score: Number(score.toFixed(1)),
      tags,
    };
  }).sort((a, b) => b.lmr_score - a.lmr_score)
    .map((r, idx) => ({ ...r, rank: idx + 1 }));

  return weighted;
}

function RadarMini({ item }) {
  if (!item) return null;
  const cx = 74;
  const cy = 74;
  const radius = 58;
  const vals = [item.n_stopa, item.n_vu, item.n_youth, item.n_wage];
  const labels = ['Stopa', 'V/U', 'Młodzi', 'Płace'];

  const points = vals.map((v, i) => {
    const angle = (-Math.PI / 2) + i * (2 * Math.PI / vals.length);
    return {
      x: cx + Math.cos(angle) * radius * v,
      y: cy + Math.sin(angle) * radius * v,
      lx: cx + Math.cos(angle) * (radius + 14),
      ly: cy + Math.sin(angle) * (radius + 14),
    };
  });

  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');
  const axes = points.map((p, i) => (
    <g key={labels[i]}>
      <line x1={cx} y1={cy} x2={p.lx - (p.lx - cx) * 0.15} y2={p.ly - (p.ly - cy) * 0.15} stroke="rgba(0,0,0,0.15)" />
      <text x={p.lx} y={p.ly} fontSize="10" textAnchor="middle" fill="var(--muted)">{labels[i]}</text>
    </g>
  ));

  return (
    <svg width="148" height="148" viewBox="0 0 148 148" aria-label="Radar 4-osiowy LMR">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(0,0,0,0.08)" />
      <circle cx={cx} cy={cy} r={radius * 0.66} fill="none" stroke="rgba(0,0,0,0.06)" />
      <circle cx={cx} cy={cy} r={radius * 0.33} fill="none" stroke="rgba(0,0,0,0.05)" />
      {axes}
      <polygon points={polygon} fill="rgba(72,149,239,0.25)" stroke="#4895ef" strokeWidth="2" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.8" fill="#1f6feb" />)}
    </svg>
  );
}

export default function LmrRankingCard({ powiaty = [] }) {
  const ranking = useMemo(() => computeLmr(powiaty), [powiaty]);
  const [selected, setSelected] = useState(() => ranking[0] || null);

  if (!ranking.length) {
    return (
      <Card title="Ranking Odporności Rynku (LMR)" badge="Brak danych">
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Brak danych do wyliczenia wskaźnika LMR.</div>
      </Card>
    );
  }

  const top5 = ranking.slice(0, 5);
  const selectedSafe = selected || top5[0];

  return (
    <Card title="Ranking Odporności Rynku (LMR Score)" badge="Mazowsze · teaser">
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 12 }}>
        <div>
          {top5.map((r) => (
            <button
              key={r.kod_teryt}
              onClick={() => setSelected(r)}
              style={{
                width: '100%',
                border: selectedSafe.kod_teryt === r.kod_teryt ? '1px solid #93c5fd' : '1px solid var(--border)',
                background: selectedSafe.kod_teryt === r.kod_teryt ? 'rgba(72,149,239,0.08)' : 'var(--bg2)',
                borderRadius: 10,
                padding: '8px 10px',
                marginBottom: 8,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 18 }}>#{r.rank}</span>
                  <strong style={{ fontSize: 13 }}>{r.nazwa}</strong>
                </div>
                <span style={{ fontWeight: 700, color: '#1f6feb' }}>{r.lmr_score}</span>
              </div>
              <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 999, height: 8 }}>
                <div style={{ width: `${r.lmr_score}%`, background: 'linear-gradient(90deg,#60a5fa,#2563eb)', height: 8, borderRadius: 999 }} />
              </div>
              {!!r.tags.length && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {r.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: 'rgba(16,185,129,0.16)', color: '#047857' }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--bg2)' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Profil powiatu</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{selectedSafe.nazwa}</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarMini item={selectedSafe} />
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
            <div>Stopa: {selectedSafe.stopa_pct.toFixed(1)}%</div>
            <div>V/U: {selectedSafe.vu_ratio.toFixed(3)}</div>
            <div>Młodzi (do 30): {(selectedSafe.youth_share * 100).toFixed(1)}%</div>
            <div>Płaca brutto: {Math.round(selectedSafe.avg_wage).toLocaleString('pl-PL')} zł</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
