import { useRef, useState, useEffect } from 'react';
import { Home, Clock, GraduationCap, Heart, Users, Shield } from 'lucide-react';
import GenderFigure from '../components/GenderFigures';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import WyrejDonut from '../components/WyrejDonut';
import StatsSelector from '../components/StatsSelector';
import { useAppData } from '../context/DataContext';
import InfoTooltip from '../components/InfoTooltip';
import { RangeSelector } from '../components/CustomSelect';

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

function formatDeltaStopa(n, prevOkres) {
  if (n == null || isNaN(n)) return null;
  const abs = Math.abs(n).toFixed(1).replace('.', ',');
  const label = miesiacNom(prevOkres);
  return n >= 0 ? `↑ +${abs} pp vs. ${label}` : `↓ −${abs} pp vs. ${label}`;
}
function fmtDelta(d, label = 'poprzedni') {
  if (d == null || isNaN(d)) return '…';
  const abs = Math.abs(d).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return d >= 0 ? `↑ +${abs} vs. ${label}` : `↓ −${abs} vs. ${label}`;
}
function fmtRR(d) {
  if (d == null || isNaN(d)) return null;
  const abs = Math.abs(Math.round(d)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return d >= 0 ? `r/r ↑ +${abs}` : `r/r ↓ \u2212${abs}`;
}
function fmtRRstopa(d) {
  if (d == null || isNaN(d)) return null;
  const abs = Math.abs(d).toFixed(1).replace('.', ',');
  return d >= 0 ? `r/r ↑ +${abs} pp` : `r/r ↓ \u2212${abs} pp`;
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
          fontSize: '0.78rem', color: '#475569', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.90rem', fontWeight: 700, color: '#1e293b',
        }}>
          {fmt(item.value)}
        </div>
        <div style={{
          fontSize: '0.70rem', color, fontWeight: 600,
          background: `${color}18`, padding: '1px 5px', borderRadius: '4px',
        }}>
          {item.pct?.toFixed(1).replace('.', ',')}%
        </div>
      </div>
    </div>
  );
}

// ── Główna strona ─────────────────────────────────────────────────────────────
export default function Bezrobotni() {
  const { bezrobotni, stopa, meta, loading } = useAppData();
  const [chartRef, chartSize] = useContainerSize();
  const [napFrom,    setNapFrom]    = useState(null);
  const [napTo,      setNapTo]      = useState(null);
  const [showZarej,  setShowZarej]  = useState(true);
  const [showWyrej,  setShowWyrej]  = useState(true);

  if (!bezrobotni) return null;

  const prevLabel    = miesiacNom(meta?.poprzedni_okres);
  const okresAbbr    = formatOkresAbbr(meta?.okres);

  const {
    bezr_razem, bezr_delta, bezr_delta_rr = null,
    wyrej_razem, wyrej_delta, wyrej_delta_rr = null,
    zarej_razem, zarej_delta, zarej_delta_rr = null,
    oferty_razem, oferty_delta, oferty_delta_rr = null,
    aktywizacja_pct = null,
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
  const aktywizacjaProgramowaPct = aktywizacja_pct ?? 0;

  const COLOR_F = '#29b6a8';  // teal — kobiety
  const COLOR_M = '#4895ef';  // niebieski — mężczyźni

  // Stopa bezrobocia Mazowieckie + delta
  const mazStopa         = stopa?.stopa_maz ?? null;
  const mazStopaDelta    = stopa?.stopa_maz_delta ?? null;
  const mazStopaDeltaRR  = stopa?.stopa_maz_delta_rr ?? null;
  const mazStopaDeltaType = mazStopaDelta == null ? 'eq' : mazStopaDelta >= 0 ? 'up' : 'dn';
  const mazStopaDeltaStr  = mazStopaDelta == null ? null : formatDeltaStopa(mazStopaDelta, meta?.stopa_poprzedni_okres);
  const stopaOkresAbbr    = formatOkresAbbr(meta?.stopa_okres);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
    }}>

      <SectionHeader
        title="Bezrobotni"
        sub="MRPiPS-01 · rejestrowane bezrobocie · województwo mazowieckie"
      />

      {/* ── Wiersz 1: 5 KPI ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px', flexShrink: 0, marginBottom: '10px',
      }}>
        <KpiCard
          flag="Stan końcowy" flagColor="maz"
          target={loading ? 0 : bezr_razem} label="Zarejestrowanych"
          delta={loading ? '…' : fmtDelta(bezr_delta, prevLabel)} deltaType={dtType(bezr_delta)}
          deltaRR={fmtRR(bezr_delta_rr)}
        />
        <KpiCard
          flag="Wyrejestrowani" flagColor="green"
          target={loading ? 0 : wyrej_razem} label="w miesiącu"
          delta={loading ? '…' : fmtDelta(wyrej_delta, prevLabel)} deltaType={dtType(wyrej_delta)}
          deltaRR={fmtRR(wyrej_delta_rr)}
          variant="green"
        />
        <KpiCard
          flag="Zarejestrowani" flagColor="pl"
          target={loading ? 0 : zarej_razem} label="w miesiącu"
          delta={loading ? '…' : fmtDelta(zarej_delta, prevLabel)} deltaType={dtType(zarej_delta)}
          deltaRR={fmtRR(zarej_delta_rr)}
        />
        <KpiCard
          flag="Oferty pracy" flagColor="green"
          target={loading ? 0 : oferty_razem} label={<>w województwie<InfoTooltip text="Liczba wolnych miejsc pracy i miejsc aktywizacji zawodowej zgłoszonych przez pracodawców do PUP." source="MRPiPS-01" /></>}
          delta={loading ? '…' : fmtDelta(oferty_delta, prevLabel)} deltaType={dtType(oferty_delta)}
          deltaRR={fmtRR(oferty_delta_rr)}
          variant="green"
        />
        <KpiCard
          flag="Intensywność aktywizacji" flagColor="green"
          target={loading ? 0 : Math.round((aktywizacjaProgramowaPct ?? 0) * 10)}
          decimals={1} suffix="%"
          label={<>w aktywnych formach (koniec mies.)<InfoTooltip text="Formuła: bezrobotni w aktywnych formach na koniec mies. ÷ bezrobotni ogółem × 100. Licznik: suma kol. 5 działu 1.3 MRPiPS-01 (stan na koniec miesiąca)." source="MRPiPS-01" /></>}
          variant="green"
        />
      </div>

      {/* ── Wiersz 2: Płeć (1/4) | Kategorie (3/8) | Charakterystyka (3/8) ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr',
        gap: '10px', minHeight: '280px', marginBottom: '10px',
      }}>

        {/* STOPA + PŁEĆ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <KpiCard
            flag={stopaOkresAbbr || 'GUS · Mazowieckie'} flagColor="maz"
            target={Math.round((mazStopa || 0) * 10)} decimals={1} suffix="%"
            label="stopa bezrobocia · Mazowieckie"
            delta={mazStopaDeltaStr} deltaType={mazStopaDeltaType}
            deltaRR={fmtRRstopa(mazStopaDeltaRR)}
            variant={mazStopaDelta != null && mazStopaDelta > 0 ? 'red' : 'green'}
          />
          <Card title={`Płeć · ${okresAbbr}`} grow>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <GenderFigure label="Kobiety"   n={kobiety}   total={total} color={COLOR_F} isFemale />
              <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0', flexShrink: 0 }} />
              <GenderFigure label="Mężczyźni" n={mezczyzni} total={total} color={COLOR_M} isFemale={false} />
            </div>
          </Card>
        </div>

        {/* KATEGORIE */}
        <Card title={`Kategorie bezrobotnych · ${okresAbbr}`} grow>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
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
        gap: '10px', marginBottom: '10px',
      }}>

        {(() => {
          const napF = napFrom ?? trendLabels[0] ?? '';
          const napT = napTo   ?? trendLabels[trendLabels.length - 1] ?? '';
          const nfi  = trendLabels.indexOf(napF);
          const nti  = trendLabels.indexOf(napT);
          const nlo  = Math.min(nfi < 0 ? 0 : nfi, nti < 0 ? trendLabels.length - 1 : nti);
          const nhi  = Math.max(nfi < 0 ? 0 : nfi, nti < 0 ? trendLabels.length - 1 : nti);
          const napLabels = trendLabels.slice(nlo, nhi + 1);
          const napDatasets = [
            showZarej && { data: trendZarej.slice(nlo, nhi + 1), color: '#e63946', label: 'Zarejestrowani' },
            showWyrej && { data: trendWyrej.slice(nlo, nhi + 1), color: '#4895ef', label: 'Wyrejestrowani' },
          ].filter(Boolean);
          const btnStyle = (active, color) => ({
            padding: '3px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontSize: '0.68rem', fontWeight: active ? 700 : 500, fontFamily: 'Outfit, sans-serif',
            background: active ? `${color}22` : 'var(--bg3)',
            color: active ? color : 'var(--muted)',
            outline: active ? `1px solid ${color}66` : 'none',
          });
          return (
            <Card
              title="Napływ i odpływ bezrobotnych"
              grow
              exportTitle="naplyw_odplyw_bezrobotnych"
              badge={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button style={btnStyle(showZarej, '#e63946')} onClick={() => setShowZarej(v => !v)}>Zarejestrowani</button>
                    <button style={btnStyle(showWyrej, '#4895ef')} onClick={() => setShowWyrej(v => !v)}>Wyrejestrowani</button>
                  </div>
                  <RangeSelector labels={trendLabels} from={napF} to={napT} onChange={(f, t) => { setNapFrom(f); setNapTo(t); }} />
                </div>
              }
            >
              <div ref={chartRef} style={{ height: '220px', overflow: 'hidden' }}>
                {napDatasets.length > 0 && trendZarej.some(v => v != null) && (
                  <LineChartSVG
                    datasets={napDatasets}
                    labels={napLabels}
                    height={Math.max(chartSize.h - 4, 100)}
                    width={Math.max(chartSize.w, 10)}
                  />
                )}
              </div>
            </Card>
          );
        })()}

        <Card title={`Przyczyny wyrejestrowania · ${okresAbbr}`} grow exportTitle="przyczyny_wyrejestrowania">
          <WyrejDonut
            data={wyrejTop5.map(r => ({ label: r.label, value: r.n, pct: r.pct }))}
          />
        </Card>

      </div>

    </div>
  );
}
