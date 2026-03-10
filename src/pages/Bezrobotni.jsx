import { Home, Clock, GraduationCap, Heart, Users, Shield } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import WyrejDonut from '../components/WyrejDonut';
import StatsSelector from '../components/StatsSelector';
import { useAppData } from '../context/DataContext';

const CZAS_LABELS = ['do 1 mies.', '1–3 mies.', '3–6 mies.', '6–12 mies.', '12–24 mies.', 'pow. 24 mies.'];
const WIEK_LABELS = ['18–24 lat', '25–34 lat', '35–44 lat', '45–54 lat', '55–59 lat', '60+ lat'];
const WYK_LABELS  = ['Wyższe', 'Pol./śr. zaw.', 'Średnie og.', 'Zasadnicze', 'Podst./brak'];
const STAZ_LABELS = ['do 1 roku', '1–5 lat', '5–10 lat', '10–20 lat', '20–30 lat', '30+ lat', 'Bez stażu'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}
function fmtDelta(d, label = 'grudzień') {
  if (d == null || isNaN(d)) return '…';
  const abs = Math.abs(d).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return d >= 0 ? `↑ +${abs} vs. ${label}` : `↓ −${abs} vs. ${label}`;
}
function dtType(d) {
  if (d == null) return 'eq';
  return d >= 0 ? 'up' : 'dn';
}

// ── SVG Sylwetki — bardziej realistyczne ─────────────────────────────────────

function FemaleSvg({ color, size = 80 }) {
  const h = Math.round(size * 130 / 60);
  return (
    <svg viewBox="0 0 60 130" width={size} height={h} fill={color} style={{ display: 'block' }}>
      {/* Kok / włosy */}
      <ellipse cx="30" cy="8" rx="10" ry="7" />
      {/* Głowa */}
      <ellipse cx="30" cy="20" rx="12" ry="13" />
      {/* Szyja */}
      <rect x="26.5" y="32" width="7" height="6" rx="2" />
      {/* Górna część ciała — talia */}
      <path d="M 17,38 C 12,44 13,52 15,56 L 45,56 C 47,52 48,44 43,38 C 38,33 22,33 17,38 Z" />
      {/* Sukienka / spódnica — trapez */}
      <path d="M 15,56 C 8,71 4,104 3,123 L 57,123 C 56,104 52,71 45,56 Z" />
      {/* Lewa ręka */}
      <path d="M 17,42 C 11,54 9,65 10,74" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      {/* Prawa ręka */}
      <path d="M 43,42 C 49,54 51,65 50,74" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function MaleSvg({ color, size = 80 }) {
  const h = Math.round(size * 130 / 60);
  return (
    <svg viewBox="0 0 60 130" width={size} height={h} fill={color} style={{ display: 'block' }}>
      {/* Głowa */}
      <ellipse cx="30" cy="14" rx="13" ry="13" />
      {/* Szyja */}
      <rect x="26.5" y="26" width="7" height="6" rx="2" />
      {/* Tors — szerokie ramiona */}
      <path d="M 9,32 C 7,42 8,57 9,65 L 51,65 C 52,57 53,42 51,32 C 44,27 16,27 9,32 Z" />
      {/* Lewa noga */}
      <path d="M 9,65 L 10,123 L 28,123 L 30,65 Z" />
      {/* Prawa noga */}
      <path d="M 30,65 L 32,123 L 50,123 L 51,65 Z" />
      {/* Lewa ręka */}
      <path d="M 9,36 C 4,51 3,65 4,77" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      {/* Prawa ręka */}
      <path d="M 51,36 C 56,51 57,65 56,77" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

// ── GenderTile — pionowy, sylwetka jako tło ───────────────────────────────────
function GenderTile({ label, n, total, color, isFemale }) {
  const pct  = total ? (n / total * 100) : 0;
  const pctStr = pct.toFixed(1).replace('.', ',');
  const r    = 24;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '10px',
      background: `${color}0e`, borderRadius: '12px',
      border: `1.5px solid ${color}28`,
      overflow: 'hidden', flex: 1,
    }}>
      {/* Sylwetka — dekoracyjne tło */}
      <div style={{
        position: 'absolute', right: '-4px', bottom: '-8px',
        opacity: 0.13, pointerEvents: 'none', userSelect: 'none',
      }}>
        {isFemale
          ? <FemaleSvg color={color} size={96} />
          : <MaleSvg   color={color} size={88} />
        }
      </div>

      {/* Etykieta */}
      <div style={{
        fontSize: '0.6rem', textTransform: 'uppercase',
        letterSpacing: '0.14em', color: `${color}cc`, fontWeight: 800,
        lineHeight: 1, zIndex: 1,
      }}>
        {label}
      </div>

      {/* Liczba */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '1.55rem', fontWeight: 900,
        color, lineHeight: 1, letterSpacing: '-0.03em', zIndex: 1,
      }}>
        {fmt(n)}
        <span style={{ fontSize: '0.55rem', fontWeight: 600, color: '#94a3b8', marginLeft: '4px' }}>os.</span>
      </div>

      {/* Kółko procentowe */}
      <div style={{ position: 'relative', zIndex: 1, alignSelf: 'flex-start' }}>
        <svg viewBox="0 0 60 60" width="58" height="58" style={{ display: 'block' }}>
          <circle cx="30" cy="30" r={r} fill="none" stroke={`${color}22`} strokeWidth="5.5" />
          <circle
            cx="30" cy="30" r={r}
            fill="none" stroke={color} strokeWidth="5.5"
            strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
          />
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.72rem', fontWeight: 800, color, lineHeight: 1.1,
          whiteSpace: 'nowrap', zIndex: 1,
        }}>
          {pctStr}<span style={{ fontSize: '0.5rem' }}>%</span>
        </div>
      </div>
    </div>
  );
}

// ── Pasek kategorii ───────────────────────────────────────────────────────────
const CAT_MAP = [
  { key: 'wsi',           Icon: Home,          color: '#16a34a' },
  { key: 'ługotrwale',    Icon: Clock,         color: '#d97706' },
  { key: 'kwalifikacji',  Icon: GraduationCap, color: '#7c3aed' },
  { key: 'dzieckiem',     Icon: Heart,         color: '#e63946' },
  { key: '50',            Icon: Users,         color: '#0891b2' },
  { key: '30',            Icon: Users,         color: '#059669' },
  { key: 'pełnosprawni',  Icon: Shield,        color: '#6366f1' },
];
function getCatMeta(label) {
  const l = label.toLowerCase();
  for (const m of CAT_MAP) if (l.includes(m.key.toLowerCase())) return m;
  return { Icon: Users, color: '#64748b' };
}
function CategoryRow({ item }) {
  const { Icon, color } = getCatMeta(item.label);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '7px 10px', flex: 1,
      background: `${color}08`, borderRadius: '8px',
      outline: `1px solid ${color}18`,
    }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '6px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={12} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.66rem', color: '#475569', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', lineHeight: 1,
        }}>
          {fmt(item.value)}
        </div>
        <div style={{ fontSize: '0.58rem', color, fontWeight: 600 }}>
          {item.pct?.toFixed(1).replace('.', ',')}%
        </div>
      </div>
    </div>
  );
}

// ── Główna strona ─────────────────────────────────────────────────────────────
export default function Bezrobotni() {
  const { bezrobotni, loading } = useAppData();

  if (!bezrobotni) return null;

  const {
    bezr_razem, bezr_delta,
    wyrej_razem, wyrej_delta,
    zarej_razem, zarej_delta,
    oferty_razem, oferty_delta,
    kategorie   = [],
    charakterystyka,
    wyrej_reasons = [],
    trend_13m     = [],
  } = bezrobotni;

  const { kobiety, mezczyzni, czas, wiek, wyk, staz = [] } = charakterystyka;

  const czasData = czas.map((n, i) => ({ label: CZAS_LABELS[i], value: n }));
  const wiekData = wiek.map((n, i) => ({ label: WIEK_LABELS[i], value: n }));
  const wykData  = wyk.map((n, i)  => ({ label: WYK_LABELS[i],  value: n }));
  const stazData = staz.map((n, i) => ({ label: STAZ_LABELS[i], value: n }));

  const top3Kat = [...kategorie].sort((a, b) => b.n - a.n).slice(0, 2)
    .map(k => ({ label: k.label, value: k.n, pct: k.pct }));

  const trendLabels = trend_13m.map(t => t.label);
  const trendZarej  = trend_13m.map(t => t.zarej);
  const trendWyrej  = trend_13m.map(t => t.wyrej);
  const wyrejTop5   = wyrej_reasons.slice(0, 5);
  const total       = kobiety + mezczyzni;

  /* Kolory płci — teal dla kobiet, niebieski dla mężczyzn */
  const COLOR_F = '#29b6a8';
  const COLOR_M = '#4895ef';

  return (
    /* Outer: 100vh - TopBar/padding, flex column, brak gap — marginBottomy spójne 10px */
    <div style={{
      height: 'calc(100vh - 90px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Nagłówek (ma własny marginBottom: 10px z Card.jsx) */}
      <SectionHeader
        title="Bezrobotni"
        sub="MRPiPS-01 · rejestrowane bezrobocie · województwo mazowieckie"
      />

      {/* ── Wiersz 1: 4 KPI ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px', flexShrink: 0, marginBottom: '10px',
      }}>
        <KpiCard
          flag="Stan końcowy" flagColor="maz"
          target={loading ? 0 : bezr_razem} label="Zarejestrowanych"
          delta={loading ? '…' : fmtDelta(bezr_delta)} deltaType={dtType(bezr_delta)}
        />
        <KpiCard
          flag="Wyrejestrowani" flagColor="green"
          target={loading ? 0 : wyrej_razem} label="w miesiącu"
          delta={loading ? '…' : fmtDelta(wyrej_delta)} deltaType={dtType(wyrej_delta)}
          variant="green"
        />
        <KpiCard
          flag="Zarejestrowani" flagColor="pl"
          target={loading ? 0 : zarej_razem} label="w miesiącu"
          delta={loading ? '…' : fmtDelta(zarej_delta)} deltaType={dtType(zarej_delta)}
        />
        <KpiCard
          flag="Oferty pracy" flagColor="green"
          target={loading ? 0 : oferty_razem} label="w województwie"
          delta={loading ? '…' : fmtDelta(oferty_delta)} deltaType={dtType(oferty_delta)}
          variant="green"
        />
      </div>

      {/* ── Wiersz 2: Kategorie | Charakterystyka ───────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', flex: 1, minHeight: 0, marginBottom: '10px',
      }}>

        {/* LEWA: sylwetki płci + 3 kategorie */}
        <Card title="Kategorie bezrobotnych · Sty 2026" grow>
          {/* flex: 1 fill — grow wrapper jest teraz flex column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Kafle płci — 58% wysokości */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '8px', flex: '0 0 58%', minHeight: 0,
              /* grid stretch → GenderTile.flex:1 działa */
              alignItems: 'stretch',
            }}>
              <GenderTile label="Kobiety"   n={kobiety}   total={total} color={COLOR_F} isFemale />
              <GenderTile label="Mężczyźni" n={mezczyzni} total={total} color={COLOR_M} isFemale={false} />
            </div>

            {/* Kategorie — reszta wysokości, równomierne rozłożenie */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              gap: '6px', minHeight: 0,
            }}>
              {top3Kat.map((item, i) => <CategoryRow key={i} item={item} />)}
            </div>
          </div>
        </Card>

        {/* PRAWA: zakładki charakterystyki */}
        <Card title="Charakterystyka bezrobotnych" grow>
          <StatsSelector
            czasData={czasData} wiekData={wiekData}
            wykData={wykData}   stazData={stazData}
          />
        </Card>

      </div>

      {/* ── Wiersz 3: Napływ/Odpływ | Przyczyny ────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', flex: 1, minHeight: 0,
      }}>

        <Card title="Napływ i odpływ bezrobotnych — ostatnie 13 miesięcy" grow>
          {/* flex: 1 → chart fills card, height prop ~90% of container */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <LineChartSVG
              datasets={[
                { data: trendZarej, color: '#e63946', label: 'Zarejestrowani' },
                { data: trendWyrej, color: '#4895ef', label: 'Wyrejestrowani' },
              ]}
              labels={trendLabels}
              height={160}
            />
          </div>
        </Card>

        <Card title="Przyczyny wyrejestrowania · Sty 2026" grow>
          <WyrejDonut
            data={wyrejTop5.map(r => ({ label: r.label, value: r.n, pct: r.pct }))}
          />
        </Card>

      </div>

    </div>
  );
}
