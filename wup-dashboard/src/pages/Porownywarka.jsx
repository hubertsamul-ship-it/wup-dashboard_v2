import { useEffect, useMemo, useState } from 'react';
import Card, { SectionHeader } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import HorizontalBar, { stopaColor } from '../components/HorizontalBar';
import MapMazowieckie from '../components/MapMazowieckie';
import MapPoland from '../components/MapPoland';
import { useAppData } from '../context/DataContext';

const A_COLOR = '#e63946';
const B_COLOR = '#4895ef';

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
          <option key={o.value} value={o.value}>{o.label}</option>
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
    { label: 'Pozycja w rankingu (1 = najwyższa stopa)', unit: 'number', a: rankMap[a?.n] ?? null, b: rankMap[b?.n] ?? null },
  ];
  return rows.map((r) => {
    const delta = (r.a == null || r.b == null) ? null : r.b - r.a;
    return { ...r, delta };
  });
}

export default function Porownywarka({ initialPowiat = null }) {
  const { powiaty, stopa, meta } = useAppData();
  const [mode, setMode] = useState('powiaty');
  const [activeSlot, setActiveSlot] = useState('A');

  const [powA, setPowA] = useState(null);
  const [powB, setPowB] = useState(null);
  const [wojA, setWojA] = useState(null);
  const [wojB, setWojB] = useState(null);

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

  const rankMap = Object.fromEntries((stopa.woj_stopa || []).map((w, idx) => [w.n, idx + 1]));
  const wojRows = buildWojRows(wojDataA, wojDataB, stopa.stopa_pl, rankMap);

  const rawTrendMaz = stopa?.trend_maz_13m || [];
  const hasNullLast = rawTrendMaz.length > 0 && rawTrendMaz[rawTrendMaz.length - 1].stopa == null;
  const trendBase = hasNullLast ? rawTrendMaz.slice(0, -1) : rawTrendMaz;
  const trendLabels = trendBase.map((t) => t.label);
  const trimSeries = (series = []) => (hasNullLast ? series.slice(0, -1) : series);

  const stopaDatasets = [
    { data: trimSeries(powDataA?.trend_stopa_13m || []), color: A_COLOR, label: `A: ${powDataA?.nazwa || '—'}` },
    { data: trimSeries(powDataB?.trend_stopa_13m || []), color: B_COLOR, label: `B: ${powDataB?.nazwa || '—'}` },
  ];

  const SHOW_N = 12;
  const napLabels = rawTrendMaz.map((t) => t.label).slice(-SHOW_N);
  const flowDatasets = [
    { data: (powDataA?.trend_zarej_13m || []).slice(-SHOW_N), color: A_COLOR, label: `A napływ` },
    { data: (powDataA?.trend_wyrej_13m || []).slice(-SHOW_N), color: A_COLOR, label: `A odpływ`, ghost: true },
    { data: (powDataB?.trend_zarej_13m || []).slice(-SHOW_N), color: B_COLOR, label: `B napływ` },
    { data: (powDataB?.trend_wyrej_13m || []).slice(-SHOW_N), color: B_COLOR, label: `B odpływ`, ghost: true },
  ];

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
        title={mode === 'powiaty' ? 'Wybór jednostek i mapa A/B' : 'Wybór województw i mapa A/B'}
        badge={formatOkresAbbr(meta?.stopa_okres)}
        exportTitle={mode === 'powiaty' ? 'porownywarka_mapa_powiaty' : 'porownywarka_mapa_woj'}
        style={{ marginBottom: 10 }}
      >
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 10 }}>
          {mode === 'powiaty'
            ? 'Woj. mazowieckie • Stopa bezrobocia (%) • Kliknij mapę, aby ustawić aktywny slot A/B'
            : 'Polska • Stopa bezrobocia (%) • Kliknij mapę, aby ustawić aktywny slot A/B'}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <button
            onClick={() => setActiveSlot('A')}
            style={{
              border: activeSlot === 'A' ? `1px solid ${A_COLOR}` : '1px solid var(--border)',
              background: activeSlot === 'A' ? `${A_COLOR}22` : 'var(--bg3)',
              color: activeSlot === 'A' ? A_COLOR : 'var(--muted)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
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
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
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

        {mode === 'powiaty' ? (
          <MapMazowieckie
            selectedWgms={[powA, powB].filter(Boolean)}
            selectionColors={[A_COLOR, B_COLOR]}
            onSelectWgm={(pow) => setPowSlot(activeSlot, pow.wgm)}
            subtitle={`Woj. mazowieckie · stopa bezrobocia (%) · ${formatOkresAbbr(meta?.stopa_okres)}`}
          />
        ) : (
          <MapPoland
            selectedWoj={[wojA, wojB].filter(Boolean)}
            selectionColors={[A_COLOR, B_COLOR]}
            onSelectWoj={(name) => setWojSlot(activeSlot, name)}
            subtitle={`Polska · stopa bezrobocia (%) · ${formatOkresAbbr(meta?.stopa_okres)}`}
          />
        )}
      </Card>

      {mode === 'powiaty' ? (
        <>
          <Card title="Kategorie metryk" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {POW_METRIC_GROUPS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGroupOn((prev) => ({ ...prev, [g.id]: !prev[g.id] }))}
                  style={{
                    border: groupOn[g.id] ? '1px solid #3b82f6' : '1px solid var(--border)',
                    background: groupOn[g.id] ? 'rgba(59,130,246,0.12)' : 'var(--bg3)',
                    color: groupOn[g.id] ? '#bfdbfe' : 'var(--muted)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Różnice A/B — metryki powiatowe" exportTitle="porownywarka_tabela_powiaty" style={{ marginBottom: 10 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                <thead>
                  <tr style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                    <th style={{ textAlign: 'left', padding: '0 8px' }}>Wskaźnik</th>
                    <th style={{ textAlign: 'right', padding: '0 8px', color: A_COLOR }}>A</th>
                    <th style={{ textAlign: 'right', padding: '0 8px', color: B_COLOR }}>B</th>
                    <th style={{ textAlign: 'right', padding: '0 8px' }}>Δ (B-A)</th>
                    <th style={{ textAlign: 'right', padding: '0 8px' }}>Δ %</th>
                  </tr>
                </thead>
                <tbody>
                  {powRows.map((r) => (
                    <tr key={r.metric.id} style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px', fontSize: '0.76rem', color: 'var(--text)' }}>{r.metric.label}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: A_COLOR }}>
                        {formatByUnit(r.a, r.metric.unit)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: B_COLOR }}>
                        {formatByUnit(r.b, r.metric.unit)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: r.delta > 0 ? '#16a34a' : (r.delta < 0 ? '#dc2626' : 'var(--muted)') }}>
                        {formatDelta(r.delta, r.metric.unit)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: 'var(--muted)' }}>
                        {r.deltaPct == null ? '—' : `${r.deltaPct > 0 ? '+' : ''}${r.deltaPct.toFixed(1).replace('.', ',')}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Card title="Trend stopy bezrobocia — A/B" exportTitle="porownywarka_trend_stopa">
              <LineChartSVG
                datasets={stopaDatasets}
                labels={trendLabels}
                height={190}
                width={900}
                showValueLabels
              />
            </Card>

            <Card title="Napływ i odpływ (12m) — A/B" exportTitle="porownywarka_trend_naplyw_odplyw">
              <LineChartSVG
                datasets={flowDatasets}
                labels={napLabels}
                height={190}
                width={900}
                showValueLabels
                valueFormatter={(v) => fmtNumber(v)}
              />
            </Card>
          </div>
        </>
      ) : (
        <>
          <Card title="Porównanie województw — tabela różnic" exportTitle="porownywarka_tabela_woj" style={{ marginBottom: 10 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                <thead>
                  <tr style={{ fontSize: '0.66rem', color: 'var(--muted)' }}>
                    <th style={{ textAlign: 'left', padding: '0 8px' }}>Wskaźnik</th>
                    <th style={{ textAlign: 'right', padding: '0 8px', color: A_COLOR }}>A</th>
                    <th style={{ textAlign: 'right', padding: '0 8px', color: B_COLOR }}>B</th>
                    <th style={{ textAlign: 'right', padding: '0 8px' }}>Δ (B-A)</th>
                  </tr>
                </thead>
                <tbody>
                  {wojRows.map((r) => (
                    <tr key={r.label} style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px', fontSize: '0.76rem', color: 'var(--text)' }}>{r.label}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: A_COLOR }}>
                        {formatByUnit(r.a, r.unit)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: B_COLOR }}>
                        {formatByUnit(r.b, r.unit)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: r.delta > 0 ? '#16a34a' : (r.delta < 0 ? '#dc2626' : 'var(--muted)') }}>
                        {formatDelta(r.delta, r.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Stopa bezrobocia — snapshot A/B" exportTitle="porownywarka_woj_stopa_snapshot">
            <HorizontalBar
              data={[
                { label: `A · ${wojDataA?.n || '—'}`, value: wojDataA?.s || 0 },
                { label: `B · ${wojDataB?.n || '—'}`, value: wojDataB?.s || 0 },
              ]}
              unit="%"
              colorFn={stopaColor}
              maxItems={2}
              barHeight={14}
              labelWidth={260}
              avgLine={stopa?.stopa_pl}
              avgLabel="Polska"
            />
          </Card>
        </>
      )}
    </div>
  );
}
