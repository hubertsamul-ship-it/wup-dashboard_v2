import { useState, useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import RankTable from '../components/RankTable';
import { useAppData } from '../context/DataContext';

const PKD_NAMES = {
  '46': 'Handel hurtowy (46)',
  '47': 'Handel detaliczny (47)',
  '49': 'Transport lądowy (49)',
  '53': 'Poczta / kurierzy (53)',
  '62': 'IT i oprogramowanie (62)',
  '64': 'Usługi finansowe (64)',
  '66': 'Ubezpieczenia (66)',
  '73': 'Reklama i marketing (73)',
  '28': 'Maszyny i urządzenia (28)',
  '20': 'Przemysł chemiczny (20)',
  '33': 'Naprawa maszyn (33)',
  '41': 'Budownictwo (41)',
  '56': 'Gastronomia (56)',
  '61': 'Telekomunikacja (61)',
  '63': 'IT — usługi inform. (63)',
  '85': 'Edukacja (85)',
  '86': 'Ochrona zdrowia (86)',
};

const pkdLabel = (kod) => PKD_NAMES[kod] || `PKD ${kod}`;

// ── Selektor zakresu dat ──────────────────────────────────────────────────

function RangeSelector({ labels, from, to, onChange }) {
  const selectStyle = {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: '6px',
    color: 'var(--text)',
    padding: '4px 8px',
    fontSize: 'var(--font-sm)',
    fontFamily: 'Outfit, sans-serif',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>Od:</span>
      <select
        value={from}
        onChange={e => onChange(e.target.value, to)}
        style={selectStyle}
      >
        {labels.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>Do:</span>
      <select
        value={to}
        onChange={e => onChange(from, e.target.value)}
        style={selectStyle}
      >
        {labels.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );
}

// ── Strona ────────────────────────────────────────────────────────────────

export default function Zwolnienia() {
  const { zwolnienia } = useAppData();

  const labels = useMemo(() => (zwolnienia?.trend_13m || []).map(t => t.label), [zwolnienia]);

  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo,   setRangeTo]   = useState(null);

  const from = rangeFrom ?? labels.find(l => l.includes('Sty 2025')) ?? labels[0] ?? '';
  const to   = rangeTo   ?? labels[labels.length - 1] ?? '';

  const rangeSum = useMemo(() => {
    if (!zwolnienia?.trend_13m) return { zgl: 0, fakt: 0, mon: 0, wyd: 0 };
    const fi = labels.indexOf(from);
    const ti = labels.indexOf(to);
    const lo = Math.min(fi, ti);
    const hi = Math.max(fi, ti);
    const slice = zwolnienia.trend_13m.slice(lo < 0 ? 0 : lo, hi < 0 ? labels.length : hi + 1);
    return {
      zgl:  slice.reduce((s, t) => s + t.zgl,  0),
      fakt: slice.reduce((s, t) => s + t.fakt, 0),
      mon:  slice.reduce((s, t) => s + t.mon,  0),
      wyd:  slice.reduce((s, t) => s + t.wyd,  0),
    };
  }, [from, to, zwolnienia, labels]);

  if (!zwolnienia) return null;

  const { zgl_cur, fakt_cur, mon_cur, wyd_cur, trend_13m = [], pkd_top10 = [], pkd_top10_fakt = [] } = zwolnienia;

  const tLabels  = trend_13m.map(t => t.label);
  const zglData  = trend_13m.map(t => t.zgl);
  const wydData  = trend_13m.map(t => t.wyd);
  const faktData = trend_13m.map(t => t.fakt);
  const monData  = trend_13m.map(t => t.mon);

  const pkdZglData  = pkd_top10.slice(0, 5).map(d      => ({ label: pkdLabel(d.pkd), value: d.n }));
  const pkdFaktData = pkd_top10_fakt.slice(0, 5).map(d => ({ label: pkdLabel(d.pkd), value: d.n }));

  return (
    <div className="page-enter">
      <SectionHeader
        title="Zwolnienia grupowe"
        sub="WUP Mazowsze · dane miesięczne"
      />

      {/* KPI — bieżący miesiąc */}
      <Grid cols={4}>
        <KpiCard flag="Zgłoszenia"   flagColor="pl"    target={zgl_cur}  label="Obj. zgłoszeniem"     variant="red"   />
        <KpiCard flag="Zwolnienia"   flagColor="maz"   target={fakt_cur} label="Faktycznie zwolnieni"  variant="red"   />
        <KpiCard flag="Monitorowane" flagColor="maz"   target={mon_cur}  label="Obj. monitoringiem"                    />
        <KpiCard flag="Wypow. zm."   flagColor="green" target={wyd_cur}  label="Zmiana warunków płacy" variant="green" />
      </Grid>

      {/* KPI — wybrany zakres */}
      <Card style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>Suma za wybrany okres</span>
          <RangeSelector
            labels={labels}
            from={from}
            to={to}
            onChange={(f, t) => { setRangeFrom(f); setRangeTo(t); }}
          />
        </div>
        <Grid cols={4}>
          <KpiCard flag="Zgłoszenia"   flagColor="pl"    target={rangeSum.zgl}  label="Obj. zgłoszeniem"     variant="red"   />
          <KpiCard flag="Zwolnienia"   flagColor="maz"   target={rangeSum.fakt} label="Faktycznie zwolnieni"  variant="red"   />
          <KpiCard flag="Monitorowane" flagColor="maz"   target={rangeSum.mon}  label="Obj. monitoringiem"                    />
          <KpiCard flag="Wypow. zm."   flagColor="green" target={rangeSum.wyd}  label="Zmiana warunków płacy" variant="green" />
        </Grid>
      </Card>

      {/* Wykresy trendu */}
      <Grid cols={2} grow>
        <Card title="Zgłoszenia i wypowiedzenia zmieniające" badge="13 miesięcy" grow>
          <LineChartSVG
            datasets={[
              { data: zglData, color: '#e63946', label: 'Zgłoszenia' },
              { data: wydData, color: '#4895ef', label: 'Wypow. zmieniające' },
            ]}
            labels={tLabels} height={150}
          />
        </Card>
        <Card title="Faktyczne zwolnienia i monitorowane" badge="13 miesięcy" grow>
          <LineChartSVG
            datasets={[
              { data: faktData, color: '#f4a261', label: 'Faktyczne' },
              { data: monData,  color: '#52b788', label: 'Monitorowane' },
            ]}
            labels={tLabels} height={150}
          />
        </Card>
      </Grid>

      {/* PKD */}
      <Grid cols={2} grow>
        <Card title="Zgłoszenia wg PKD · ost. 12 m." badge="Top 5" grow>
          <RankTable data={pkdZglData}  unit=" os." accentColor="#e63946" />
        </Card>
        <Card title="Faktyczne zwolnienia wg PKD · ost. 12 m." badge="Top 5" grow>
          <RankTable data={pkdFaktData} unit=" os." accentColor="#e63946" />
        </Card>
      </Grid>
    </div>
  );
}
