import {
  ChefHat, Salad, Briefcase, Users, Building2, Code, Terminal,
  Scissors, Flower, Flower2, Sparkles, Shovel, Hammer,
  Truck, ShoppingCart, Stethoscope, GraduationCap, Wrench,
  HardHat, Utensils, Landmark, Shield, Factory,
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import HorizontalBar, { greenColor, stopaColor } from '../components/HorizontalBar';
import RankTable from '../components/RankTable';
import { useAppData } from '../context/DataContext';

const ZAWOD_MAP = [
  // Konkretne zawody z danych
  { keys: ['żywności', 'żywien', 'technolog żyw', 'dietet'],  Icon: ChefHat,      color: '#fb923c' },
  { keys: ['dyrektor', 'prezes', 'zarządz', 'naczelnik'],     Icon: Briefcase,     color: '#0891b2' },
  { keys: ['mediator', 'mediacja'],                            Icon: Users,         color: '#9b8ccc' },
  { keys: ['urzędnik', 'urzędnicy', 'władz', 'wyższy ur'],   Icon: Building2,     color: '#64748b' },
  { keys: ['programist', 'developer', 'softw'],                Icon: Code,          color: '#38bdf8' },
  { keys: ['informatyk', 'it ', 'ict', 'systemy inf'],         Icon: Terminal,      color: '#22d3ee' },
  { keys: ['fryzjer', 'fryzjers'],                             Icon: Scissors,      color: '#f472b6' },
  { keys: ['kamieniarz', 'kamieniar'],                         Icon: Hammer,        color: '#78716c' },
  { keys: ['florist', 'florysta', 'kwiac'],                    Icon: Flower2,       color: '#f472b6' },
  { keys: ['niekonwencjonaln', 'terapii', 'alternatyw', 'bioenergoterapeut', 'naturoterap'], Icon: Sparkles, color: '#a78bfa' },
  { keys: ['brukarz', 'brukar', 'chodnikarz'],                 Icon: Shovel,        color: '#d97706' },
  // Ogólne kategorie jako fallback
  { keys: ['kucharz', 'gastron', 'kelner', 'barman', 'cukiern'], Icon: Utensils,   color: '#f3a683' },
  { keys: ['kierowca', 'transport', 'przewóz'],                Icon: Truck,         color: '#f4a261' },
  { keys: ['sprzedawca', 'kasjer', 'handel'],                  Icon: ShoppingCart,  color: '#4895ef' },
  { keys: ['lekarz', 'pielęgniar', 'medycz', 'ratow'],        Icon: Stethoscope,   color: '#e63946' },
  { keys: ['nauczyciel', 'pedagog', 'trener'],                 Icon: GraduationCap, color: '#9b8ccc' },
  { keys: ['mechanik', 'elektryk', 'naprawa', 'serwis'],      Icon: Wrench,        color: '#fbbf24' },
  { keys: ['budowlan', 'murarz', 'monter', 'inżynier bud'],   Icon: HardHat,       color: '#fb923c' },
  { keys: ['bank', 'ubezpiecz', 'finanse', 'makler'],         Icon: Landmark,      color: '#059669' },
  { keys: ['ochroniar', 'strażnik', 'ochrona'],               Icon: Shield,        color: '#64748b' },
  { keys: ['operator', 'produkcj', 'przemysł'],               Icon: Factory,       color: '#78716c' },
];

function getZawodIcon(label) {
  const l = label.toLowerCase();
  for (const m of ZAWOD_MAP) {
    if (m.keys.some(k => l.includes(k))) {
      // floryści — dwa kwiatki
      if (m.Icon === Flower2) return (
        <span style={{ display: 'inline-flex', gap: '1px' }}>
          <Flower2 size={11} color="#f472b6" strokeWidth={2} />
          <Flower  size={10} color="#fb7185" strokeWidth={2} />
        </span>
      );
      return <m.Icon size={12} color={m.color} strokeWidth={2} />;
    }
  }
  return <Briefcase size={12} color="#94a3b8" strokeWidth={2} />;
}

const toBar  = arr => (arr || []).map(r => ({ label: r.label, value: r.value }));
const toBar5 = arr => (arr || []).slice(0, 5).map(r => ({ label: r.label, value: r.value }));

export default function Wynagrodzenia() {
  const { wynagrodzenia_kpi } = useAppData();
  if (!wynagrodzenia_kpi) return null;

  const {
    avg_wyn_uop,
    top5_pow_wyn, bot5_pow_wyn,
    top10_zawody_best, top10_zawody_worst,
  } = wynagrodzenia_kpi;

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Wynagrodzenia"
        sub="ZUS · Blender Danych · województwo mazowieckie · I poł. 2025"
      />

      {/* ── Wiersz 1: KPI ────────────────────────────────────────────────────── */}
      <Grid cols={3} style={{ gap: '10px', marginBottom: '10px' }}>
        <KpiCard flag="Śr. wynagrodzenie brutto (UoP)" flagColor="green"
          target={Math.round(avg_wyn_uop || 0)} suffix=" zł"
          label="Mazowieckie · I poł. 2025"
          variant="green"
        />
        <KpiCard flag="Maks. wynagrodzenie — powiat" flagColor="green"
          target={Math.round(top5_pow_wyn?.[0]?.value || 0)} suffix=" zł"
          label={top5_pow_wyn?.[0]?.label || '—'}
          variant="green"
        />
        <KpiCard flag="Min. wynagrodzenie — powiat" flagColor="maz"
          target={Math.round(bot5_pow_wyn?.[0]?.value || 0)} suffix=" zł"
          label={bot5_pow_wyn?.[0]?.label || '—'}
          variant="red"
        />
      </Grid>

      {/* ── Wiersz 2: Rankingi powiatów ──────────────────────────────────────── */}
      <Grid cols={2} style={{ gap: '10px', marginBottom: '10px' }}>
        <Card title="TOP 5 powiatów wg wynagrodzenia" badge="Top 5">
          <HorizontalBar data={toBar(top5_pow_wyn)} unit=" zł" colorFn={greenColor} />
        </Card>
        <Card title="5 powiatów z najniższym wynagrodzeniem" badge="Bot 5">
          <HorizontalBar data={toBar(bot5_pow_wyn)} unit=" zł" colorFn={stopaColor} />
        </Card>
      </Grid>

      {/* ── Wiersz 3: Rankingi zawodów ───────────────────────────────────────── */}
      <Grid cols={2} style={{ gap: '10px', marginBottom: '10px' }}>
        <Card title="TOP 5 najlepiej opłacanych zawodów (min. 50 UoP)" badge="Top 5">
          <RankTable data={toBar5(top10_zawody_best)} unit=" zł" accentColor="#52b788" getIcon={getZawodIcon} />
        </Card>
        <Card title="TOP 5 najniżej opłacanych zawodów (min. 50 UoP)" badge="Bot 5">
          <RankTable data={toBar5(top10_zawody_worst)} unit=" zł" accentColor="#e63946" reverse getIcon={getZawodIcon} />
        </Card>
      </Grid>

      {/* ── Nota metodologiczna ──────────────────────────────────────────────── */}
      <NotaMetodologiczna />
    </div>
  );
}

function NotaMetodologiczna() {
  const punkty = [
    'Wynagrodzenia dotyczą wyłącznie umów o pracę (UoP) i są średnimi z I półrocza 2025 r.',
    'Liczba pracujących obejmuje wszystkie formy zatrudnienia (UoP, umowy cywilnoprawne, DG) na dzień 30.06.2025.',
    'Aby uniknąć błędu agregacji (niezgodność populacji: wynagrodzenia UoP vs. pracujący ogółem), zastosowano korektę: Waga = liczba pracujących × odsetek umów o pracę, co daje szacunkową liczbę zatrudnionych na UoP.',
    'Średnia ważona = Σ(wynagrodzenie × waga) / Σ(waga), gdzie waga = pracujący × %UoP.',
    'Rankingi zawodów z filtrem min. 50 szac. UoP eliminują zawody z małą próbą, podatne na zniekształcenia.',
    'Dane źródłowe: ZUS, przetworzone w systemie Blender Danych.',
  ];
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(0,0,0,0.018)',
      border: '1px solid var(--card-br)',
      borderRadius: '10px',
      marginBottom: '10px',
    }}>
      <div style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.09em',
        color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '7px',
      }}>
        Nota metodologiczna
      </div>
      <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {punkty.map((t, i) => (
          <li key={i} style={{ fontSize: '0.65rem', color: 'var(--muted)', lineHeight: 1.55, paddingLeft: '12px', textIndent: '-12px' }}>
            <span style={{ marginRight: '5px', opacity: 0.5 }}>–</span>{t}
          </li>
        ))}
      </ul>
    </div>
  );
}
