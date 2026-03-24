import { useEffect, useMemo, useState } from 'react';
import Card, { SectionHeader } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import HorizontalBar, { stopaColor } from '../components/HorizontalBar';
import MapMazowieckie from '../components/MapMazowieckie';
import MapPoland from '../components/MapPoland';
import { useAppData } from '../context/DataContext';

const A_COLOR = '#e63946';
const B_COLOR = '#fbbf24';
const POW_COLORS = ['#e63946', '#4895ef', '#f4a261', '#52b788', '#a78bfa', '#fbbf24'];
const CHART_COLORS = ['#e63946', '#4895ef', '#f4a261'];

const MONTHS_ABBR = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

const POW_METRIC_GROUPS = [
  {
    id: 'rynek',
    label: 'Rynek pracy',
    metrics: [
      { id: 'stopa', label: 'Stopa bezrobocia', unit: 'percent', get: (p) => p?.stopa },
      { id: 'bezr', label: 'Bezrobotni (stan)', unit: 'number', get: (p) => p?.bezr_razem },
      { id: 'zarej', label: 'Napływ bezrobotnych', unit: 'number', get: (p) => p?.zarej_razem },
      { id: 'wyrej', label: 'Odpływ bezrobotnych', unit: 'number', get: (p) => p?.wyrej_razem },
      { id: 'oferty', label: 'Oferty pracy', unit: 'number', get: (p) => p?.oferty_pracy },
      { id: 'aktywizacja', label: 'Skuteczność aktywizacji', unit: 'percent', get: (p) => p?.aktywizacja_pct },
    ],
  },
  {
    id: 'placa',
    label: 'Wynagrodzenia i pracujący',
    metrics: [
      { id: 'wyn', label: 'Śr. wynagrodzenie brutto', unit: 'currency', get: (p) => p?.wyn_brutto },
      { id: 'prac', label: 'Pracujący ogółem', unit: 'number', get: (p) => p?.wyn_pracujacy },
    ],
  },
];

function formatOkresAbbr(s) {
  if (!s) return '';
  const [y, m] = s.split('-').map(Number);
  return `${MONTHS_ABBR[m - 1]} ${y}`;
}

function fmtNumber(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n).toLocaleString('pl-PL');
}

function fmtPercent(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Number(n).toFixed(1).replace('.', ',')}%`;
}

function fmtCurrency(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${Math.round(n).toLocaleString('pl-PL')} zł`;
}

function formatByUnit(value, unit) {
  if (value == null || Number.isNaN(value)) return '—';
  if (unit === 'percent') return fmtPercent(value);
  if (unit === 'currency') return fmtCurrency(value);
  return fmtNumber(value);
}

function formatDelta(value, unit) {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  if (unit === 'percent') return `${sign}${value.toFixed(1).replace('.', ',')} pp`;
  if (unit === 'currency') return `${sign}${Math.round(value).toLocaleString('pl-PL')} zł`;
  return `${sign}${Math.round(value).toLocaleString('pl-PL')}`;
}

function SelectUnit({ label, value, options, onChange, color }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
      <span style={{ fontSize: '0.66rem', color: 'var(--muted)', letterSpacing: '0.07em', fontWeight: 700 }}>
        {label}
      </span>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          borderRadius: 10,
          border: `1px solid ${color}88`,
          background: `${color}10`,
          color: 'var(--text)',
          fontSize: '0.78rem',
          padding: '8px 10px',
          fontFamily: 'Outfit, sans-serif',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#1e293b', color: '#e2e8f0' }}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function buildPowRows(metrics, aData, bData) {
  return metrics
    .map((m) => {
      const a = m.get(aData);
      const b = m.get(bData);
      if (a == null && b == null) return null;
      const delta = (a == null || b == null) ? null : b - a;
      const deltaPct = (a == null || b == null || a === 0) ? null : (delta / a) * 100;
      return { metric: m, a, b, delta, deltaPct };
    })
    .filter(Boolean);
}

function buildWojRows(a, b, stopaPl, rankMap) {
  const rows = [
    { label: 'Stopa bezrobocia', unit: 'percent', a: a?.s, b: b?.s },
    { label: 'Różnica do Polski', unit: 'percent', a: a?.s != null ? a.s - stopaPl : null, b: b?.s != null ? b.s - stopaPl : null },
    { label: 'Pozycja w rankingu (1 = najniższa stopa)', unit: 'number', a: rankMap[a?.n] ?? null, b: rankMap[b?.n] ?? null },
  ];
  return rows.map((r) => {
    const delta = (r.a == null || r.b == null) ? null : r.b - r.a;
    return { ...r, delta };
  });
}

// ── Selektor powiatów do porównania (do 6) ───────────────────────────────────
function PowiatSelector({ selected, onChange, allPowiaty, max = 6 }) {
  const [open, setOpen] = useState(false);
  const available = allPowiaty.filter((p) => !selected.includes(p.wgm));
  const getName  = (wgm) => allPowiaty.find((p) => p.wgm === wgm)?.nazwa || wgm;
  const getStopa = (wgm) => allPowiaty.find((p) => p.wgm === wgm)?.stopa;

  const remove = (wgm) => { if (selected.length > 1) onChange(selected.filter((w) => w !== wgm)); };
  const add    = (wgm) => { if (selected.length < max) onChange([...selected, wgm]); setOpen(false); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' }}>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
      {selected.map((wgm, i) => (
        <div key={wgm} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px 3px 10px', borderRadius: '20px',
          background: `${POW_COLORS[i % POW_COLORS.length]}22`,
          border: `1px solid ${POW_COLORS[i % POW_COLORS.length]}66`,
          fontSize: '0.72rem', color: 'var(--text)',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: POW_COLORS[i % POW_COLORS.length], flexShrink: 0 }} />
          {getName(wgm)}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: POW_COLORS[i % POW_COLORS.length], marginLeft: '2px' }}>
            {getStopa(wgm)?.toFixed(1).replace('.', ',')}%
          </span>
          {selected.length > 1 && (
            <button
              onClick={() => remove(wgm)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}
              title={`Usuń ${getName(wgm)}`}
            >×</button>
          )}
        </div>
      ))}
      {selected.length < max && (
        <div style={{ position: 'relative', zIndex: 100 }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px', color: 'var(--muted)', cursor: 'pointer', padding: '3px 12px',
              fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
            }}
          >+ Dodaj</button>
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#1a2233', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', padding: '4px 0',
              maxHeight: '260px', overflowY: 'auto', minWidth: '210px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 101,
            }}>
              {available.map((p) => (
                <button
                  key={p.wgm}
                  onClick={() => add(p.wgm)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    color: '#e2e8f0', padding: '6px 14px', fontSize: '0.75rem',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <span>{p.nazwa}</span>
                  <span style={{ color: '#94a3b8', marginLeft: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem' }}>
                    {p.stopa?.toFixed(1).replace('.', ',')}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Selektor województw do trendu (do 3) ─────────────────────────────────────
function WojSelector({ selected, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const available = options.filter((w) => !selected.includes(w.n));

  const remove = (woj) => { if (selected.length > 1) onChange(selected.filter((w) => w !== woj)); };
  const add    = (woj) => { if (selected.length < 3) onChange([...selected, woj]); setOpen(false); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' }}>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
      {selected.map((woj, i) => (
        <div key={woj} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px 3px 10px', borderRadius: '20px',
          background: `${CHART_COLORS[i]}22`, border: `1px solid ${CHART_COLORS[i]}66`,
          fontSize: '0.72rem', color: 'var(--text)',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: CHART_COLORS[i], flexShrink: 0 }} />
          {woj}
          {selected.length > 1 && (
            <button
              onClick={() => remove(woj)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}
              title={`Usuń ${woj}`}
            >×</button>
          )}
        </div>
      ))}
      {selected.length < 3 && (
        <div style={{ position: 'relative', zIndex: 100 }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px', color: 'var(--muted)', cursor: 'pointer', padding: '3px 12px',
              fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
            }}
          >+ Dodaj</button>
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#1a2233', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', padding: '4px 0',
              maxHeight: '220px', overflowY: 'auto', minWidth: '170px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 101,
            }}>
              {available.map((w) => (
                <button
                  key={w.n}
                  onClick={() => add(w.n)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    color: 'var(--text)', padding: '6px 14px', fontSize: '0.75rem',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <span>{w.n}</span>
                  <span style={{ color: 'var(--muted)', marginLeft: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem' }}>{w.s}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Porownywarka({ initialPowiat = null }) {
  const { powiaty, stopa, meta, pulpit } = useAppData();
  const [mode, setMode] = useState('powiaty');
  const [activeSlot, setActiveSlot] = useState('A');

  const [powA, setPowA] = useState(null);
  const [powB, setPowB] = useState(null);
  const [wojA, setWojA] = useState(null);
  const [wojB, setWojB] = useState(null);
  const [cmpWgms, setCmpWgms] = useState([]);
  const [selWojs, setSelWojs] = useState(['Mazowieckie']);

  const [groupOn, setGroupOn] = useState(() => (
    Object.fromEntries(POW_METRIC_GROUPS.map((g) => [g.id, true]))
  ));

  const powOptions = useMemo(
    () => [...(powiaty || [])]
      .sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))
      .map((p) => ({ value: p.wgm, label: p.nazwa })),
    [powiaty]
  );

  const wojOptions = useMemo(
    () => [...(stopa?.woj_stopa || [])]
      .sort((a, b) => a.n.localeCompare(b.n, 'pl'))
      .map((w) => ({ value: w.n, label: w.n, stopa: w.s })),
    [stopa]
  );

  useEffect(() => {
    if (!powOptions.length) return;
    if (!powA) {
      const defaultA = (initialPowiat && powOptions.some((o) => o.value === initialPowiat))
        ? initialPowiat
        : (powOptions.find((o) => o.value === '1465')?.value || powOptions[0].value);
      setPowA(defaultA);
    }
    if (!powB) {
      const aNow = powA
        || ((initialPowiat && powOptions.some((o) => o.value === initialPowiat))
          ? initialPowiat
          : (powOptions.find((o) => o.value === '1465')?.value || powOptions[0].value));
      const second = powOptions.find((o) => o.value !== aNow);
      if (second) setPowB(second.value);
    }
  }, [powOptions, powA, powB, initialPowiat]);

  useEffect(() => {
    if (!wojOptions.length) return;
    if (!wojA) {
      const defaultA = wojOptions.find((w) => w.value === 'Mazowieckie')?.value || wojOptions[0].value;
      setWojA(defaultA);
    }
    if (!wojB) {
      const aNow = wojA || wojOptions.find((w) => w.value === 'Mazowieckie')?.value || wojOptions[0].value;
      const second = wojOptions.find((w) => w.value !== aNow);
      if (second) setWojB(second.value);
    }
  }, [wojOptions, wojA, wojB]);

  // Inicjalizuj cmpWgms gdy powA/powB są gotowe
  useEffect(() => {
    if (!cmpWgms.length && powA) {
      setCmpWgms([powA, powB].filter(Boolean));
    }
  }, [powA, powB]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!powiaty || !stopa) return null;

  const powDataA = (powiaty || []).find((p) => p.wgm === powA) || null;
  const powDataB = (powiaty || []).find((p) => p.wgm === powB) || null;

  const wojDataA = (stopa.woj_stopa || []).find((w) => w.n === wojA) || null;
  const wojDataB = (stopa.woj_stopa || []).find((w) => w.n === wojB) || null;

  const setPowSlot = (slot, val) => {
    if (slot === 'A') {
      if (val === powB) setPowB(powA);
      setPowA(val);
      setActiveSlot('B');
    } else {
      if (val === powA) setPowA(powB);
      setPowB(val);
      setActiveSlot('A');
    }
  };

  const setWojSlot = (slot, val) => {
    if (slot === 'A') {
      if (val === wojB) setWojB(wojA);
      setWojA(val);
      setActiveSlot('B');
    } else {
      if (val === wojA) setWojA(wojB);
      setWojB(val);
      setActiveSlot('A');
    }
  };

  const activeMetrics = POW_METRIC_GROUPS
    .filter((g) => groupOn[g.id])
    .flatMap((g) => g.metrics);
  const powRows = buildPowRows(activeMetrics, powDataA, powDataB);

  const rankMap = Object.fromEntries(
    [...(stopa.woj_stopa || [])].sort((a, b) => a.s - b.s).map((w, idx) => [w.n, idx + 1])
  );
  const wojRows = buildWojRows(wojDataA, wojDataB, stopa.stopa_pl, rankMap);

  // ── Dane trendów powiatowych ─────────────────────────────────────────────
  const rawTrendMaz = stopa?.trend_maz_13m || [];
  const hasNullLast = rawTrendMaz.length > 0 && rawTrendMaz[rawTrendMaz.length - 1].stopa == null;
  const trendLabels = (hasNullLast ? rawTrendMaz.slice(0, -1) : rawTrendMaz).map((t) => t.label);

  const powSorted = useMemo(
    () => [...(powiaty || [])].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl')),
    [powiaty]
  );

  const cmpStopaDatasets = useMemo(
    () => cmpWgms.map((w, i) => {
      const p = (powiaty || []).find((x) => x.wgm === w);
      const series = p?.trend_stopa_13m || [];
      const data = hasNullLast ? series.slice(0, -1) : series;
      return { color: POW_COLORS[i % POW_COLORS.length], label: p?.nazwa || w, data };
    }),
    [cmpWgms, powiaty, hasNullLast]
  );

  const SHOW_N = 12;
  const napLabels = rawTrendMaz.map((t) => t.label).slice(-SHOW_N);
  const flowDatasets = [
    { data: (powDataA?.trend_zarej_13m || []).slice(-SHOW_N), color: A_COLOR, label: `${powDataA?.nazwa || 'A'} napływ` },
    { data: (powDataA?.trend_wyrej_13m || []).slice(-SHOW_N), color: A_COLOR, label: `${powDataA?.nazwa || 'A'} odpływ`, ghost: true },
    { data: (powDataB?.trend_zarej_13m || []).slice(-SHOW_N), color: B_COLOR, label: `${powDataB?.nazwa || 'B'} napływ` },
    { data: (powDataB?.trend_wyrej_13m || []).slice(-SHOW_N), color: B_COLOR, label: `${powDataB?.nazwa || 'B'} odpływ`, ghost: true },
  ];

  // ── Dane trendu województw ───────────────────────────────────────────────
  const stopa_pl_val = stopa.stopa_pl ?? 5.4;
  const trend37 = (pulpit?.trend_37m || []).filter((t) => t.stopa != null);
  const maz37Stopa = trend37.map((t) => t.stopa);
  const trend37Labels = trend37.map((t) => t.label);

  const WOJ_OPTIONS = [
    { n: 'Mazowieckie', s: (stopa.woj_stopa || []).find((w) => w.n === 'Mazowieckie')?.s ?? stopa.stopa_maz },
    { n: 'Polska', s: stopa_pl_val },
    ...(stopa.woj_stopa || []).filter((w) => w.n !== 'Mazowieckie').sort((a, b) => a.n.localeCompare(b.n, 'pl')),
  ];

  function genWojTrend(currentStopa) {
    const scale = currentStopa / (stopa_pl_val || 5.4);
    return maz37Stopa.map((v) => Math.round(v * scale * 10) / 10);
  }

  const wojTrendDatasets = selWojs.map((woj, i) => ({
    color: CHART_COLORS[i % CHART_COLORS.length],
    label: woj,
    data: woj === 'Mazowieckie'
      ? maz37Stopa
      : genWojTrend((stopa.woj_stopa || []).find((w) => w.n === woj)?.s ?? stopa_pl_val),
  }));

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Porównywarka A/B"
        sub={`Powiaty i województwa · porównanie 1:1 · ${formatOkresAbbr(meta?.okres)}`}
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[
          { id: 'powiaty', label: 'Powiaty' },
          { id: 'woj', label: 'Województwa (stopa)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            style={{
              border: mode === t.id ? '1px solid #3b82f6' : '1px solid var(--border)',
              background: mode === t.id ? 'rgba(59,130,246,0.14)' : 'var(--bg3)',
              color: mode === t.id ? '#bfdbfe' : 'var(--muted)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card
        title={mode === 'powiaty' ? 'Wybór jednostek A/B' : 'Wybór województw i mapa A/B'}
        badge={formatOkresAbbr(meta?.stopa_okres)}
        exportTitle={mode === 'powiaty' ? 'porownywarka_wybor_powiaty' : 'porownywarka_mapa_woj'}
        style={{ marginBottom: 10 }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 10 }}>
          {mode === 'powiaty'
            ? 'Woj. mazowieckie • Kliknij mapę w sekcji poniżej, aby ustawić aktywny slot A/B'
            : 'Polska • Stopa bezrobocia (%) • Kliknij mapę, aby ustawić aktywny slot A/B'}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            onClick={() => setActiveSlot('A')}
            style={{
              border: activeSlot === 'A' ? `1px solid ${A_COLOR}` : '1px solid var(--border)',
              background: activeSlot === 'A' ? `${A_COLOR}22` : 'var(--bg3)',
              color: activeSlot === 'A' ? A_COLOR : 'var(--muted)',
              borderRadius: 20, padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Aktywny slot: A
          </button>
          <button
            onClick={() => setActiveSlot('B')}
            style={{
              border: activeSlot === 'B' ? `1px solid ${B_COLOR}` : '1px solid var(--border)',
              background: activeSlot === 'B' ? `${B_COLOR}22` : 'var(--bg3)',
              color: activeSlot === 'B' ? B_COLOR : 'var(--muted)',
              borderRadius: 20, padding: '5px 12px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Aktywny slot: B
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {mode === 'powiaty' ? (
            <>
              <SelectUnit label="POWIAT A" value={powA} options={powOptions} onChange={(v) => setPowSlot('A', v)} color={A_COLOR} />
              <SelectUnit label="POWIAT B" value={powB} options={powOptions} onChange={(v) => setPowSlot('B', v)} color={B_COLOR} />
            </>
          ) : (
            <>
              <SelectUnit label="WOJEWÓDZTWO A" value={wojA} options={wojOptions} onChange={(v) => setWojSlot('A', v)} color={A_COLOR} />
              <SelectUnit label="WOJEWÓDZTWO B" value={wojB} options={wojOptions} onChange={(v) => setWojSlot('B', v)} color={B_COLOR} />
            </>
          )}
        </div>

      </Card>

      {mode === 'powiaty' ? (
        <>
          <Card title="Kategorie metryk i różnice A/B" exportTitle="porownywarka_tabela_powiaty" style={{ marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

              {/* Lewa: kategorie + tabela */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted)', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>KATEGORIE METRYK</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {POW_METRIC_GROUPS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGroupOn((prev) => ({ ...prev, [g.id]: !prev[g.id] }))}
                        style={{
                          border: groupOn[g.id] ? '1px solid #3b82f6' : '1px solid var(--border)',
                          background: groupOn[g.id] ? 'rgba(59,130,246,0.12)' : 'var(--bg3)',
                          color: groupOn[g.id] ? '#bfdbfe' : 'var(--muted)',
                          borderRadius: 999, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted)', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>RÓŻNICE A/B — METRYKI POWIATOWE</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                      <thead>
                        <tr style={{ fontSize: '0.63rem', color: 'var(--muted)' }}>
                          <th style={{ textAlign: 'left', padding: '0 6px' }}>Wskaźnik</th>
                          <th style={{ textAlign: 'right', padding: '0 6px', color: A_COLOR, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {powDataA?.nazwa || 'A'}
                          </th>
                          <th style={{ textAlign: 'right', padding: '0 6px', color: B_COLOR, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {powDataB?.nazwa || 'B'}
                          </th>
                          <th style={{ textAlign: 'right', padding: '0 6px' }}>Δ (B-A)</th>
                          <th style={{ textAlign: 'right', padding: '0 6px' }}>Δ %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {powRows.map((r) => (
                          <tr key={r.metric.id} style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '6px', fontSize: '0.73rem', color: 'var(--text)' }}>{r.metric.label}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: A_COLOR }}>
                              {formatByUnit(r.a, r.metric.unit)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: B_COLOR }}>
                              {formatByUnit(r.b, r.metric.unit)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.71rem', color: r.delta > 0 ? '#16a34a' : (r.delta < 0 ? '#dc2626' : 'var(--muted)') }}>
                              {formatDelta(r.delta, r.metric.unit)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.71rem', color: 'var(--muted)' }}>
                              {r.deltaPct == null ? '—' : `${r.deltaPct > 0 ? '+' : ''}${r.deltaPct.toFixed(1).replace('.', ',')}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Prawa: mapa (połowa szerokości karty) */}
              <div>
                <MapMazowieckie
                  selectedWgms={[powA, powB].filter(Boolean)}
                  selectionColors={[A_COLOR, B_COLOR]}
                  onSelectWgm={(pow) => setPowSlot(activeSlot, pow.wgm)}
                  subtitle={`Woj. mazowieckie · stopa bezrobocia (%) · ${formatOkresAbbr(meta?.stopa_okres)}`}
                />
              </div>
            </div>
          </Card>

          <Card title="Stopa bezrobocia — porównanie powiatów" exportTitle="porownywarka_stopa_powiaty" style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 10 }}>
              <PowiatSelector
                selected={cmpWgms.length ? cmpWgms : [powA, powB].filter(Boolean)}
                onChange={setCmpWgms}
                allPowiaty={powSorted}
                max={6}
              />
            </div>
            <LineChartSVG
              datasets={cmpStopaDatasets}
              labels={trendLabels}
              height={200}
              width={900}
              showValueLabels
            />
          </Card>

          <Card title={`Napływ i odpływ (12m) — ${powDataA?.nazwa || 'A'} / ${powDataB?.nazwa || 'B'}`} exportTitle="porownywarka_trend_naplyw_odplyw">
            <LineChartSVG
              datasets={flowDatasets}
              labels={napLabels}
              height={200}
              width={900}
              showValueLabels
              valueFormatter={(v) => fmtNumber(v)}
            />
          </Card>
        </>
      ) : (
        <>
          <Card title="Różnice A/B i mapa województw" exportTitle="porownywarka_tabela_mapa_woj" style={{ marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

              {/* Lewa: tabela różnic + snapshot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted)', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>RÓŻNICE A/B — METRYKI WOJEWÓDZTW</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                      <thead>
                        <tr style={{ fontSize: '0.63rem', color: 'var(--muted)' }}>
                          <th style={{ textAlign: 'left', padding: '0 6px' }}>Wskaźnik</th>
                          <th style={{ textAlign: 'right', padding: '0 6px', color: A_COLOR, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {wojDataA?.n || 'A'}
                          </th>
                          <th style={{ textAlign: 'right', padding: '0 6px', color: B_COLOR, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {wojDataB?.n || 'B'}
                          </th>
                          <th style={{ textAlign: 'right', padding: '0 6px' }}>Δ (B-A)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wojRows.map((r) => (
                          <tr key={r.label} style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '6px', fontSize: '0.73rem', color: 'var(--text)' }}>{r.label}</td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: A_COLOR }}>
                              {formatByUnit(r.a, r.unit)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: B_COLOR }}>
                              {formatByUnit(r.b, r.unit)}
                            </td>
                            <td style={{ padding: '6px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.71rem', color: r.delta > 0 ? '#16a34a' : (r.delta < 0 ? '#dc2626' : 'var(--muted)') }}>
                              {formatDelta(r.delta, r.unit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--muted)', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 6 }}>STOPA BEZROBOCIA — SNAPSHOT A/B</div>
                  <HorizontalBar
                    data={[
                      { label: `A · ${wojDataA?.n || '—'}`, value: wojDataA?.s || 0 },
                      { label: `B · ${wojDataB?.n || '—'}`, value: wojDataB?.s || 0 },
                    ]}
                    unit="%"
                    colorFn={stopaColor}
                    maxItems={2}
                    barHeight={14}
                    labelWidth={220}
                    avgLine={stopa?.stopa_pl}
                    avgLabel="Polska"
                  />
                </div>
              </div>

              {/* Prawa: mapa (połowa szerokości karty) */}
              <div>
                <MapPoland
                  selectedWoj={[wojA, wojB].filter(Boolean)}
                  selectionColors={[A_COLOR, B_COLOR]}
                  onSelectWoj={(name) => setWojSlot(activeSlot, name)}
                  subtitle={`Polska · stopa bezrobocia (%) · ${formatOkresAbbr(meta?.stopa_okres)}`}
                />
              </div>
            </div>
          </Card>

          <Card title="Trend stopy bezrobocia 2023–2026" exportTitle="porownywarka_woj_trend">
            <div style={{ marginBottom: 8 }}>
              <WojSelector selected={selWojs} onChange={setSelWojs} options={WOJ_OPTIONS} />
            </div>
            <LineChartSVG
              datasets={wojTrendDatasets}
              labels={trend37Labels}
              height={200}
              width={900}
              showValueLabels
            />
          </Card>
        </>
      )}
    </div>
  );
}
