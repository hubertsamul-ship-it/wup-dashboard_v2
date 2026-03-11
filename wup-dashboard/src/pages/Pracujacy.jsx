import { useState, useEffect } from 'react';
import {
  Briefcase, Monitor, Truck, ShoppingBag, GraduationCap,
  Wrench, Zap, Building2, FileText, HeartPulse, Package,
  Camera, Shield, Trophy, Activity, Heart, Film, HardHat, Stethoscope,
} from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader } from '../components/Card';
import HorizontalBar, { blueColor, greenColor } from '../components/HorizontalBar';
import { useAppData } from '../context/DataContext';

// ── Formattery ───────────────────────────────────────────────────────────────
const fmtPct = v => v?.toFixed(2).replace('.', ',') + '%';
function fmtVal(v, unit) {
  if (unit === '%') return v.toFixed(2).replace('.', ',') + '%';
  return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + unit;
}

// ── Mapowanie ikon do nazw zawodów (keyword matching) ────────────────────────
const ZAWOD_MAP = [
  // Bardziej specyficzne — muszą być przed ogólnymi
  { key: 'ubezpiecz',      Icon: Shield,        color: '#0891b2' }, // agenci ubezpieczeniowi
  { key: 'ochrony',        Icon: Shield,        color: '#64748b' }, // pracownicy ochrony fizycznej
  { key: 'opiekun',        Icon: Heart,         color: '#e63946' }, // opiekunowie osoby starszej
  { key: 'sportow',        Icon: Trophy,        color: '#f4a261' }, // zawodowi sportowcy
  { key: 'rekreac',        Icon: Activity,      color: '#52b788' }, // instruktorzy rekreacji i sportu
  { key: 'instrukto',      Icon: Activity,      color: '#52b788' }, // instruktorzy (innych specjalności)
  { key: 'fotograf',       Icon: Camera,        color: '#7c3aed' }, // fotografowie
  { key: 'producenc',      Icon: Film,          color: '#7c3aed' }, // reżyserzy i producenci film.
  { key: 'dentyst',        Icon: Stethoscope,   color: '#e63946' }, // dentyści
  { key: 'weterynari',     Icon: Heart,         color: '#52b788' }, // lekarze weterynarii
  { key: 'operator',       Icon: Wrench,        color: '#0891b2' }, // operatorzy maszyn
  { key: 'fizyczni',       Icon: HardHat,       color: '#f4a261' }, // pracownicy fizyczni w produkcji
  { key: 'administracyj',  Icon: FileText,      color: '#64748b' }, // pracownicy administracyjni
  { key: 'zarz',           Icon: Building2,     color: '#d97706' }, // personel/kierownicy zarządzający
  // Ogólne
  { key: 'informatyk',     Icon: Monitor,       color: '#4895ef' },
  { key: 'programist',     Icon: Monitor,       color: '#4895ef' },
  { key: 'specjalista ds', Icon: Monitor,       color: '#4895ef' },
  { key: 'kierowc',        Icon: Truck,         color: '#f4a261' },
  { key: 'handlowiec',     Icon: ShoppingBag,   color: '#52b788' },
  { key: 'sprzedawc',      Icon: ShoppingBag,   color: '#52b788' },
  { key: 'kasjer',         Icon: ShoppingBag,   color: '#52b788' },
  { key: 'agent',          Icon: ShoppingBag,   color: '#52b788' },
  { key: 'lekarz',         Icon: HeartPulse,    color: '#e63946' },
  { key: 'pielęgniar',     Icon: HeartPulse,    color: '#e63946' },
  { key: 'nauczyciel',     Icon: GraduationCap, color: '#7c3aed' },
  { key: 'wykładow',       Icon: GraduationCap, color: '#7c3aed' },
  { key: 'inżynier',       Icon: Wrench,        color: '#0891b2' },
  { key: 'technik',        Icon: Wrench,        color: '#0891b2' },
  { key: 'monter',         Icon: Wrench,        color: '#0891b2' },
  { key: 'elektryk',       Icon: Zap,           color: '#d97706' },
  { key: 'energetyk',      Icon: Zap,           color: '#d97706' },
  { key: 'menedżer',       Icon: Building2,     color: '#d97706' },
  { key: 'dyrektor',       Icon: Building2,     color: '#d97706' },
  { key: 'kierownik',      Icon: Building2,     color: '#d97706' },
  { key: 'pracownik biur', Icon: FileText,      color: '#64748b' },
  { key: 'sekretark',      Icon: FileText,      color: '#64748b' },
  { key: 'magazyn',        Icon: Package,       color: '#f4a261' },
  { key: 'logistyk',       Icon: Package,       color: '#f4a261' },
];
function getZawodMeta(label) {
  const l = label.toLowerCase();
  for (const m of ZAWOD_MAP) if (l.includes(m.key)) return m;
  return { Icon: Briefcase, color: '#64748b' };
}

// ── Animowany pasek postępu ───────────────────────────────────────────────────
function ProgressBar({ pct, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => requestAnimationFrame(() => setWidth(pct)), delay + 60);
    return () => clearTimeout(id);
  }, [pct, delay]);
  return (
    <div style={{ height: '6px', background: `${color}1a`, borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${width}%`, background: color,
        borderRadius: '99px', transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  );
}

// ── Lista zawodów z ikonami i paskami ────────────────────────────────────────
function ZawodList({ data = [], color = '#4895ef', unit = '%' }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {data.map((item, i) => {
        const { Icon, color: iColor } = getZawodMeta(item.label);
        const barPct = (item.value / maxVal) * 100;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: `${iColor}16`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={14} color={iColor} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.7rem', color: '#475569', lineHeight: 1.3, marginBottom: '5px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.label}
              </div>
              <ProgressBar pct={barPct} color={color} delay={i * 40} />
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.82rem', fontWeight: 700, color,
              flexShrink: 0, textAlign: 'right', minWidth: '58px',
            }}>
              {fmtVal(item.value, unit)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Taby: Dominujące formy zatrudnienia ───────────────────────────────────────
const EMP_TABS = [
  { id: 'uop',   label: 'Umowy o pracę',      color: '#52b788' },
  { id: 'dg',    label: 'Działalność gosp.',   color: '#e63946' },
  { id: 'cywil', label: 'Cywilnoprawne',       color: '#4895ef' },
];

function ZawodyTabs({ uopData = [], dgData = [], cywilData = [] }) {
  const [active, setActive] = useState('uop');
  const datasets = { uop: uopData, dg: dgData, cywil: cywilData };
  const activeTab = EMP_TABS.find(t => t.id === active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexShrink: 0 }}>
        {EMP_TABS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                padding: '5px 13px', borderRadius: '20px',
                fontSize: '0.64rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : '#64748b',
                background: isActive ? '#1e3a6e' : 'rgba(0,0,0,0.05)',
                border: isActive ? 'none' : '1px solid rgba(0,0,0,0.07)',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >{label}</button>
          );
        })}
      </div>
      <div key={active} style={{ flex: 1, animation: 'fadeIn 0.2s ease' }}>
        <ZawodList data={datasets[active]} color={activeTab?.color} unit="%" />
      </div>
    </div>
  );
}

// ── Główna strona ─────────────────────────────────────────────────────────────
export default function Pracujacy() {
  const { pracujacy } = useAppData();
  if (!pracujacy) return null;

  const {
    razem, pct_uop, n_uop, pct_cywil, n_cywil, pct_dg, n_dg,
    top5_pracujacy, bot5_pracujacy,
    top5_zawody_pracujacy, top5_zawody_uop,
    top5_pow_cywil, top5_zawody_dg,
  } = pracujacy;

  const toRows = arr => (arr || []).map(r => ({ label: r.label, value: r.value }));

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Pracujący"
        sub="ZUS · Blender Danych · województwo mazowieckie · I poł. 2025"
      />

      {/* ── Wiersz 1: 4 KPI ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px', marginBottom: '14px',
      }}>
        <KpiCard flag="Pracujący ogółem"   flagColor="green" target={razem}   label="Mazowieckie · I poł. 2025" variant="green" />
        <KpiCard flag="Umowy o pracę"      flagColor="maz"   target={n_uop}   label={`${fmtPct(pct_uop)} pracujących`} />
        <KpiCard flag="Cywilnoprawne"      flagColor="pl"    target={n_cywil} label={`${fmtPct(pct_cywil)} pracujących`} />
        <KpiCard flag="Dział. gospodarcza" flagColor="maz"   target={n_dg}    label={`${fmtPct(pct_dg)} pracujących`} />
      </div>

      {/* ── Wiersz 2: TOP/BOT powiaty ────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '14px', marginBottom: '14px',
      }}>
        <Card title="TOP 5 powiatów wg liczby pracujących" badge="Top 5" grow>
          <HorizontalBar data={toRows(top5_pracujacy)} unit=" os." colorFn={blueColor} />
        </Card>
        <Card title="5 powiatów z najmniejszą liczbą pracujących" badge="Bot 5" grow>
          <HorizontalBar data={toRows(bot5_pracujacy)} unit=" os." colorFn={greenColor} />
        </Card>
      </div>

      {/* ── Wiersz 3: TOP 5 zawodów + Dominujące formy ──────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '14px',
      }}>
        <Card title="TOP 5 zawodów wg liczby pracujących" badge="Top 5" grow>
          <ZawodList data={toRows(top5_zawody_pracujacy)} color="#4895ef" unit=" os." />
        </Card>
        <Card title="Dominujące formy zatrudnienia w zawodach" grow>
          <ZawodyTabs
            uopData={toRows(top5_zawody_uop)}
            dgData={toRows(top5_zawody_dg)}
            cywilData={toRows(top5_pow_cywil)}
          />
        </Card>
      </div>

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
      marginTop: '4px',
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
