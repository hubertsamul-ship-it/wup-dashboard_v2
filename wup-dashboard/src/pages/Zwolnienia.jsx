import { useState, useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import RankTable from '../components/RankTable';
import CustomSelect, { RangeSelector } from '../components/CustomSelect';
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

// ── Strona ────────────────────────────────────────────────────────────────

export default function Zwolnienia() {
  const { zwolnienia } = useAppData();

  const labels = useMemo(() => (zwolnienia?.trend_13m || []).map(t => t.label), [zwolnienia]);

  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo,   setRangeTo]   = useState(null);
  const [pkdMiesiac, setPkdMiesiac] = useState(null);
  const [activeSeries, setActiveSeries] = useState(['zgl']);
  const [chartFrom,  setChartFrom]  = useState(null);
  const [chartTo,    setChartTo]    = useState(null);

  const JAN26 = labels.find(l => l.startsWith('Sty') && l.includes('26')) || labels[0] || '';
  const from = rangeFrom ?? JAN26;
  const to   = rangeTo   ?? labels[labels.length - 1] ?? '';
  const pkdLabel_ = pkdMiesiac ?? labels[labels.length - 1] ?? '';

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

  const { zgl_cur, fakt_cur, mon_cur, wyd_cur, trend_13m = [] } = zwolnienia;

  const tLabels  = trend_13m.map(t => t.label);
  const zglData  = trend_13m.map(t => t.zgl);
  const wydData  = trend_13m.map(t => t.wyd);
  const faktData = trend_13m.map(t => t.fakt);
  const monData  = trend_13m.map(t => t.mon);

  const pkdMEntry = trend_13m.find(t => t.label === pkdLabel_) ?? trend_13m[trend_13m.length - 1];
  const pkdZglData  = (pkdMEntry?.pkd      || []).slice(0, 5).map(d => ({ label: pkdLabel(d.pkd), value: d.n }));
  const pkdFaktData = (pkdMEntry?.pkd_fakt || []).slice(0, 5).map(d => ({ label: pkdLabel(d.pkd), value: d.n }));

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

      {/* Wykres trendu — przełącznik */}
      {(() => {
        const cFrom = chartFrom ?? JAN26;
        const cTo   = chartTo   ?? tLabels[tLabels.length - 1] ?? '';
        const ci    = tLabels.indexOf(cFrom);
        const cj    = tLabels.indexOf(cTo);
        const cLo   = Math.min(ci < 0 ? 0 : ci, cj < 0 ? tLabels.length - 1 : cj);
        const cHi   = Math.max(ci < 0 ? 0 : ci, cj < 0 ? tLabels.length - 1 : cj);
        const cLabels  = tLabels.slice(cLo, cHi + 1);
        const cZgl  = zglData.slice(cLo, cHi + 1);
        const cWyd  = wydData.slice(cLo, cHi + 1);
        const cFakt = faktData.slice(cLo, cHi + 1);
        const cMon  = monData.slice(cLo, cHi + 1);
        const SERIES = [
          { id: 'zgl',  data: cZgl,  color: '#e63946', label: 'Zgłoszenia' },
          { id: 'fakt', data: cFakt, color: '#f4a261', label: 'Zwolnienia' },
          { id: 'wyd',  data: cWyd,  color: '#4895ef', label: 'Wypow. zm.' },
          { id: 'mon',  data: cMon,  color: '#52b788', label: 'Monitorowane' },
        ];
        const datasets = SERIES.filter(s => activeSeries.includes(s.id));
        const toggleSeries = (id) => setActiveSeries(prev =>
          prev.includes(id)
            ? prev.length > 1 ? prev.filter(x => x !== id) : prev
            : [...prev, id]
        );
        return (
          <Card
            title="Trend zwolnień grupowych"
            exportTitle="trend_zwolnien"
            badge={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {SERIES.map(opt => {
                    const active = activeSeries.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleSeries(opt.id)}
                        style={{
                          padding: '3px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          fontSize: '0.68rem', fontWeight: active ? 700 : 500,
                          fontFamily: 'Outfit, sans-serif',
                          background: active ? `${opt.color}22` : 'var(--bg3)',
                          color: active ? opt.color : 'var(--muted)',
                          outline: active ? `1px solid ${opt.color}66` : 'none',
                        }}
                      >{opt.label}</button>
                    );
                  })}
                </div>
                <RangeSelector
                  labels={tLabels}
                  from={cFrom}
                  to={cTo}
                  onChange={(f, t) => { setChartFrom(f); setChartTo(t); }}
                />
              </div>
            }
            style={{ marginBottom: '10px' }}
          >
            <LineChartSVG datasets={datasets} labels={cLabels} height={160} />
          </Card>
        );
      })()}

      {/* PKD — ranking miesięczny */}
      <Card style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>Ranking PKD · miesiąc</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>Miesiąc:</span>
            <CustomSelect value={pkdLabel_} onChange={v => setPkdMiesiac(v)} options={labels} minWidth={100} />
          </div>
        </div>
        <Grid cols={2} grow>
          <Card title="Zgłoszenia wg PKD" badge="Top 5" grow>
            <RankTable data={pkdZglData}  unit=" os." accentColor="#e63946" />
          </Card>
          <Card title="Faktyczne zwolnienia wg PKD" badge="Top 5" grow>
            <RankTable data={pkdFaktData} unit=" os." accentColor="#e63946" />
          </Card>
        </Grid>
      </Card>
    </div>
  );
}
