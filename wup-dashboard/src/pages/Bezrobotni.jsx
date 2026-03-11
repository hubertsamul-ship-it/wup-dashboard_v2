import { useRef, useState, useEffect } from 'react';
import { Home, Clock, GraduationCap, Heart, Users, Shield } from 'lucide-react';
import GenderFigure from '../components/GenderFigures';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import WyrejDonut from '../components/WyrejDonut';
import StatsSelector from '../components/StatsSelector';
import { useAppData } from '../context/DataContext';

// Hook mierzący rozmiar kontenera — chart wypełnia dostępną przestrzeń
function useContainerSize(defaultW = 560, defaultH = 200) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: defaultW, h: defaultH });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

const CZAS_LABELS = ['do 1 mies.', '1–3 mies.', '3–6 mies.', '6–12 mies.', '12–24 mies.', 'pow. 24 mies.'];
const WIEK_LABELS = ['18–24 lat', '25–34 lat', '35–44 lat', '45–54 lat', '55–59 lat', '60+ lat'];
const WYK_LABELS  = ['Wyższe', 'Pol./śr. zaw.', 'Średnie og.', 'Zasadnicze', 'Podst./brak'];
const STAZ_LABELS = ['do 1 roku', '1–5 lat', '5–10 lat', '10–20 lat', '20–30 lat', '30+ lat', 'Bez stażu'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}
const MONTHS_NOM = [
  'styczeń','luty','marzec','kwiecień','maj','czerwiec',
  'lipiec','sierpień','wrzesień','październik','listopad','grudzień',
];
const MONTHS_ABBR = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

function miesiacNom(s) {
  if (!s) return 'poprzedni';
  const m = parseInt(s.split('-')[1], 10);
  return MONTHS_NOM[m - 1] ?? 'poprzedni';
}
function formatOkresAbbr(s) {
  if (!s) return '';
  const [y, m] = s.split('-').map(Number);
  return `${MONTHS_ABBR[m - 1]} ${y}`;
}

function fmtDelta(d, label = 'poprzedni') {
  if (d == null || isNaN(d)) return '…';
  const abs = Math.abs(d).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return d >= 0 ? `↑ +${abs} vs. ${label}` : `↓ −${abs} vs. ${label}`;
}
function dtType(d) {
  if (d == null) return 'eq';
  return d >= 0 ? 'up' : 'dn';
}

// ── Kategorie — ikony ────────────────────────────────────────────────────────
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
      padding: '5px 8px', flex: 1, minHeight: 0,
      background: `${color}08`, borderRadius: '8px',
      outline: `1px solid ${color}18`,
    }}>
      <div style={{
        width: '24px', height: '24px', borderRadius: '6px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={11} color={color} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.62rem', color: '#475569', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2,
        }}>
          {fmt(item.value)}
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color, fontWeight: 600 }}>
          {item.pct?.toFixed(1).replace('.', ',')}%
        </div>
      </div>
    </div>
  );
}

// ── Główna strona ─────────────────────────────────────────────────────────────
export default function Bezrobotni() {
  const { bezrobotni, meta, loading } = useAppData();
  const [chartRef, chartSize] = useContainerSize();

  if (!bezrobotni) return null;

  const prevLabel    = miesiacNom(meta?.poprzedni_okres);
  const okresAbbr    = formatOkresAbbr(meta?.okres);

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

  // Wszystkie kategorie, posortowane malejąco
  const allKat = [...kategorie].sort((a, b) => b.n - a.n)
    .map(k => ({ label: k.label, value: k.n, pct: k.pct }));

  const trendLabels = trend_13m.map(t => t.label);
  const trendZarej  = trend_13m.map(t => t.zarej);
  const trendWyrej  = trend_13m.map(t => t.wyrej);
  const wyrejTop5   = wyrej_reasons.slice(0, 5);
  const total       = kobiety + mezczyzni;

  const COLOR_F = '#29b6a8';  // teal — kobiety
  const COLOR_M = '#4895ef';  // niebieski — mężczyźni

  return (
    <div style={{
      height: 'calc(100vh - 90px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

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
          delta={loading ? '…' : fmtDelta(bezr_delta, prevLabel)} deltaType={dtType(bezr_delta)}
        />
        <KpiCard
          flag="Wyrejestrowani" flagColor="green"
          target={loading ? 0 : wyrej_razem} label="w miesiącu"
          delta={loading ? '…' : fmtDelta(wyrej_delta, prevLabel)} deltaType={dtType(wyrej_delta)}
          variant="green"
        />
        <KpiCard
          flag="Zarejestrowani" flagColor="pl"
          target={loading ? 0 : zarej_razem} label="w miesiącu"
          delta={loading ? '…' : fmtDelta(zarej_delta, prevLabel)} deltaType={dtType(zarej_delta)}
        />
        <KpiCard
          flag="Oferty pracy" flagColor="green"
          target={loading ? 0 : oferty_razem} label="w województwie"
          delta={loading ? '…' : fmtDelta(oferty_delta, prevLabel)} deltaType={dtType(oferty_delta)}
          variant="green"
        />
      </div>

      {/* ── Wiersz 2: Płeć (1/4) | Kategorie (3/8) | Charakterystyka (3/8) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr',
        gap: '10px', flex: 1, minHeight: 0, marginBottom: '10px',
      }}>

        {/* PŁEĆ */}
        <Card title={`Płeć · ${okresAbbr}`} grow>
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'row',
            minHeight: 0,
          }}>
            <GenderFigure
              label="Kobiety" n={kobiety} total={total}
              color={COLOR_F} isFemale
            />
            <div style={{
              width: '1px', background: 'rgba(0,0,0,0.06)',
              margin: '4px 0', flexShrink: 0,
            }} />
            <GenderFigure
              label="Mężczyźni" n={mezczyzni} total={total}
              color={COLOR_M} isFemale={false}
            />
          </div>
        </Card>

        {/* KATEGORIE */}
        <Card title={`Kategorie bezrobotnych · ${okresAbbr}`} grow>
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            gap: '6px', minHeight: 0,
          }}>
            {allKat.map((item, i) => <CategoryRow key={i} item={item} />)}
          </div>
        </Card>

        {/* CHARAKTERYSTYKA */}
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
          <div ref={chartRef} style={{ flex: 1, minHeight: 0 }}>
            <LineChartSVG
              datasets={[
                { data: trendZarej, color: '#e63946', label: 'Zarejestrowani' },
                { data: trendWyrej, color: '#4895ef', label: 'Wyrejestrowani' },
              ]}
              labels={trendLabels}
              height={Math.max(chartSize.h - 4, 100)}
              width={chartSize.w}
            />
          </div>
        </Card>

        <Card title={`Przyczyny wyrejestrowania · ${okresAbbr}`} grow>
          <WyrejDonut
            data={wyrejTop5.map(r => ({ label: r.label, value: r.n, pct: r.pct }))}
          />
        </Card>

      </div>

    </div>
  );
}
