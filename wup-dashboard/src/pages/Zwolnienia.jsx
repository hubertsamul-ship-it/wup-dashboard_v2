import { useState, useMemo } from 'react';
import {
  Package, ShoppingCart, Truck, Mail, Code, Landmark, Shield,
  Megaphone, Settings, FlaskConical, Wrench, HardHat, Utensils,
  Phone, Server, GraduationCap, Stethoscope, Factory,
  Car, Building2, BookOpen, Zap, Printer, ChefHat, Briefcase, Gamepad2,
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import RankTable from '../components/RankTable';
import { useAppData } from '../context/DataContext';

const PKD_NAMES = {
  '10': 'Prod. artykułów spożywczych (10)',
  '12': 'Prod. wyrobów tytoniowych (12)',
  '13': 'Prod. wyrobów tekstylnych (13)',
  '15': 'Prod. skór i wyrobów skórz. (15)',
  '17': 'Prod. papieru (17)',
  '18': 'Poligrafia (18)',
  '20': 'Przemysł chemiczny (20)',
  '21': 'Farmaceutyki (21)',
  '22': 'Prod. wyrobów gumowych (22)',
  '23': 'Prod. wyrobów niemetalicznych (23)',
  '25': 'Prod. wyrobów metalowych (25)',
  '27': 'Prod. urządzeń elektrycznych (27)',
  '28': 'Maszyny i urządzenia (28)',
  '29': 'Prod. pojazdów samochodowych (29)',
  '32': 'Pozostała prod. wyrobów (32)',
  '33': 'Naprawa maszyn (33)',
  '41': 'Budownictwo (41)',
  '43': 'Roboty budowlane spec. (43)',
  '46': 'Handel hurtowy (46)',
  '47': 'Handel detaliczny (47)',
  '49': 'Transport lądowy (49)',
  '52': 'Magazynowanie (52)',
  '53': 'Poczta / kurierzy (53)',
  '56': 'Gastronomia (56)',
  '58': 'Działalność wydawnicza (58)',
  '61': 'Telekomunikacja (61)',
  '62': 'IT i oprogramowanie (62)',
  '63': 'IT — usługi inform. (63)',
  '64': 'Usługi finansowe (64)',
  '66': 'Ubezpieczenia (66)',
  '69': 'Działalność prawnicza (69)',
  '70': 'Firmy centralne / doradztwo (70)',
  '72': 'Badania naukowe (72)',
  '73': 'Reklama i marketing (73)',
  '74': 'Pozostała dział. profesj. (74)',
  '82': 'Obsługa biura i działalność (82)',
  '84': 'Administracja publiczna (84)',
  '85': 'Edukacja (85)',
  '86': 'Ochrona zdrowia (86)',
  '92': 'Działalność rozrywkowa (92)',
};

const pkdLabel = (kod) => PKD_NAMES[kod] || `PKD ${kod}`;

const PKD_ICONS = {
  '10': { Icon: ChefHat,       color: '#fb923c' },
  '12': { Icon: Factory,       color: '#78716c' },
  '13': { Icon: Factory,       color: '#a78bfa' },
  '15': { Icon: Factory,       color: '#b45309' },
  '17': { Icon: Factory,       color: '#64748b' },
  '18': { Icon: Printer,       color: '#475569' },
  '20': { Icon: FlaskConical,  color: '#34d399' },
  '21': { Icon: FlaskConical,  color: '#10b981' },
  '22': { Icon: Factory,       color: '#6b7280' },
  '23': { Icon: Factory,       color: '#94a3b8' },
  '25': { Icon: Factory,       color: '#78716c' },
  '27': { Icon: Zap,           color: '#facc15' },
  '28': { Icon: Settings,      color: '#94a3b8' },
  '29': { Icon: Car,           color: '#3b82f6' },
  '32': { Icon: Factory,       color: '#94a3b8' },
  '33': { Icon: Wrench,        color: '#d97706' },
  '41': { Icon: HardHat,       color: '#fb923c' },
  '43': { Icon: HardHat,       color: '#f59e0b' },
  '46': { Icon: Package,       color: '#f4a261' },
  '47': { Icon: ShoppingCart,  color: '#4895ef' },
  '49': { Icon: Truck,         color: '#fbbf24' },
  '52': { Icon: Package,       color: '#60a5fa' },
  '53': { Icon: Mail,          color: '#a78bfa' },
  '56': { Icon: Utensils,      color: '#f87171' },
  '58': { Icon: BookOpen,      color: '#7c3aed' },
  '61': { Icon: Phone,         color: '#22d3ee' },
  '62': { Icon: Code,          color: '#38bdf8' },
  '63': { Icon: Server,        color: '#818cf8' },
  '64': { Icon: Landmark,      color: '#52b788' },
  '66': { Icon: Shield,        color: '#6366f1' },
  '69': { Icon: Landmark,      color: '#0ea5e9' },
  '70': { Icon: Briefcase,     color: '#0891b2' },
  '72': { Icon: FlaskConical,  color: '#8b5cf6' },
  '73': { Icon: Megaphone,     color: '#f3a683' },
  '74': { Icon: Briefcase,     color: '#64748b' },
  '82': { Icon: Settings,      color: '#6b7280' },
  '84': { Icon: Building2,     color: '#475569' },
  '85': { Icon: GraduationCap, color: '#9b8ccc' },
  '86': { Icon: Stethoscope,   color: '#e63946' },
  '92': { Icon: Gamepad2,      color: '#f472b6' },
};

function getPkdIcon(label) {
  // label wygląda jak "Handel hurtowy (46)" — wyciągamy kod
  const m = label.match(/\((\d+)\)/);
  if (m) {
    const entry = PKD_ICONS[m[1]];
    if (entry) return <entry.Icon size={12} color={entry.color} strokeWidth={2} />;
  }
  return <Factory size={12} color="#94a3b8" strokeWidth={2} />;
}

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
  const [pkdMiesiac, setPkdMiesiac] = useState(null);

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

  const {
    zgl_cur, fakt_cur, mon_cur, wyd_cur,
    trend_13m = [], pkd_top10 = [], pkd_top10_fakt = [],
    pkd_monthly = null,
  } = zwolnienia;

  const trend12  = trend_13m.slice(-12);
  const tLabels  = trend12.map(t => t.label);
  const zglData  = trend12.map(t => t.zgl);
  const wydData  = trend12.map(t => t.wyd);
  const faktData = trend12.map(t => t.fakt);
  const monData  = trend12.map(t => t.mon);

  // Selektor miesiąca dla PKD — domyślnie ostatni dostępny miesiąc
  const pkdMonth = pkdMiesiac ?? tLabels[tLabels.length - 1] ?? '';

  // Dane PKD: jeśli są dane miesięczne — filtruj po wybranym miesiącu,
  // w przeciwnym razie pokaż agregat roczny
  const hasPkdMonthly = pkd_monthly && pkd_monthly[pkdMonth];
  const pkdZglData = hasPkdMonthly
    ? [...pkd_monthly[pkdMonth]]
        .sort((a, b) => b.zgl - a.zgl)
        .slice(0, 5)
        .map(d => ({ label: pkdLabel(d.pkd), value: d.zgl }))
    : pkd_top10.slice(0, 5).map(d => ({ label: pkdLabel(d.pkd), value: d.n }));
  const pkdFaktData = hasPkdMonthly
    ? [...pkd_monthly[pkdMonth]]
        .sort((a, b) => b.fakt - a.fakt)
        .slice(0, 5)
        .map(d => ({ label: pkdLabel(d.pkd), value: d.fakt }))
    : pkd_top10_fakt.slice(0, 5).map(d => ({ label: pkdLabel(d.pkd), value: d.n }));

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
        <Card title="Zgłoszenia i wypowiedzenia zmieniające" badge="12 miesięcy" grow>
          <LineChartSVG
            datasets={[
              { data: zglData, color: '#e63946', label: 'Zgłoszenia' },
              { data: wydData, color: '#4895ef', label: 'Wypow. zmieniające' },
            ]}
            labels={tLabels} height={150}
          />
        </Card>
        <Card title="Faktyczne zwolnienia i monitorowane" badge="12 miesięcy" grow>
          <LineChartSVG
            datasets={[
              { data: faktData, color: '#f4a261', label: 'Faktyczne' },
              { data: monData,  color: '#52b788', label: 'Monitorowane' },
            ]}
            labels={tLabels} height={150}
          />
        </Card>
      </Grid>

      {/* PKD — selektor miesiąca */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '8px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
          Ranking PKD · miesiąc:
        </span>
        <select
          value={pkdMonth}
          onChange={e => setPkdMiesiac(e.target.value)}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text)',
            padding: '4px 28px 4px 10px',
            fontSize: '0.75rem',
            fontFamily: 'Outfit, sans-serif',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {tLabels.map(l => (
            <option key={l} value={l}
              style={{ background: 'var(--card-bg)', color: 'var(--text)' }}
            >{l}</option>
          ))}
        </select>
        {!hasPkdMonthly && (
          <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontStyle: 'italic' }}>
            (ranking za ost. 12 mies.)
          </span>
        )}
      </div>

      <Grid cols={2} grow>
        <Card title={`Zgłoszenia wg PKD · ${pkdMonth}`} badge="Top 5" grow>
          <RankTable data={pkdZglData}  unit=" os." accentColor="#e63946" getIcon={getPkdIcon} />
        </Card>
        <Card title={`Faktyczne zwolnienia wg PKD · ${pkdMonth}`} badge="Top 5" grow>
          <RankTable data={pkdFaktData} unit=" os." accentColor="#e63946" getIcon={getPkdIcon} />
        </Card>
      </Grid>
    </div>
  );
}
