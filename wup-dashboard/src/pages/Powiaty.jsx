import { useState, useEffect, useRef } from 'react';
import { Home, Clock, GraduationCap, Heart, Users, Shield } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import WyrejDonut from '../components/WyrejDonut';
import StatsSelector from '../components/StatsSelector';
import GenderFigure from '../components/GenderFigures';
import { useAppData } from '../context/DataContext';
import { RangeSelector } from '../components/CustomSelect';

const POW_COLORS = ['#e63946', '#4895ef', '#f4a261', '#52b788', '#a78bfa', '#fbbf24'];


const CZAS_LABELS = ['do 1 mies.', '1–3 mies.', '3–6 mies.', '6–12 mies.', '12–24 mies.', 'pow. 24 mies.'];
const WIEK_LABELS = ['18–24 lat', '25–34 lat', '35–44 lat', '45–54 lat', '55–59 lat', '60+ lat'];
const WYK_LABELS  = ['Wyższe', 'Pol./śr. zaw.', 'Średnie og.', 'Zasadnicze', 'Podst./brak'];
const STAZ_LABELS = ['do 1 roku', '1–5 lat', '5–10 lat', '10–20 lat', '20–30 lat', '30+ lat', 'Bez stażu'];

function fmt(n) {
  if (n == null) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

// ── Hook mierzący rozmiar kontenera ──────────────────────────────────────────
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

// ── Kategorie — ikony ─────────────────────────────────────────────────────────
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
  if (d == null || isNaN(d)) return null;
  const abs = Math.abs(d).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return d >= 0 ? `↑ +${abs} vs. ${label}` : `↓ −${abs} vs. ${label}`;
}

// ── Searchable dropdown dla wyboru powiatu ───────────────────────────────────
function PowiatDropdown({ options, value, onChange }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const selected = options.find(o => o.value === value);
  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const select = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  return (
    <div style={{ position: 'relative', marginBottom: '10px' }}>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => { setOpen(false); setQuery(''); }} />}

      {/* Trigger */}
      <button
        onClick={() => { setOpen(v => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{
          width: '100%', padding: '10px 36px 10px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)', borderRadius: '10px',
          color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem',
          cursor: 'pointer', textAlign: 'left', position: 'relative',
        }}
      >
        {selected?.label || '— wybierz powiat —'}
        <span style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.65rem', color: 'var(--muted)', pointerEvents: 'none',
        }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#0f172a', border: '1px solid var(--border)',
          borderRadius: '10px', zIndex: 99,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj powiatu…"
              style={{
                width: '100%', padding: '6px 10px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '12px 14px', fontSize: '0.75rem', color: 'var(--muted)' }}>Brak wyników</div>
              : filtered.map(o => (
                <button
                  key={o.value}
                  onClick={() => select(o.value)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: o.value === value ? 'rgba(255,255,255,0.10)' : 'none',
                    border: 'none', color: o.value === value ? '#fff' : '#cbd5e1',
                    padding: '7px 14px', fontSize: '0.78rem',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'none'; }}
                >
                  {o.label}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Główna strona ─────────────────────────────────────────────────────────────
export default function Powiaty({ initialPowiat = null }) {
  const { powiaty, stopa, meta } = useAppData();
  const [chartRef, chartSize] = useContainerSize();

  const options = (powiaty || [])
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))
    .map(p => ({ value: p.wgm, label: p.nazwa }));

  const [selWgm, setSelWgm] = useState(initialPowiat);
  const [napFrom,   setNapFrom]   = useState(null);
  const [napTo,     setNapTo]     = useState(null);
  const [showZarej, setShowZarej] = useState(true);
  const [showWyrej, setShowWyrej] = useState(true);

  const defaultWgm = (powiaty || []).find(p => p.wgm === '1465')?.wgm || options[0]?.value || null;
  const wgm = selWgm || defaultWgm;

const d = (powiaty || []).find(p => p.wgm === wgm) || {};

  if (!powiaty || powiaty.length === 0) return null;

  const bezr  = d.bezr_razem || 0;
  const wyrej = d.wyrej_razem || 0;

  const prevLabel  = miesiacNom(meta?.poprzedni_okres);
  const okresAbbr  = formatOkresAbbr(meta?.okres);

  // Charakterystyka
  const czasData = (d.d5_czas || []).map((n, i) => ({ label: CZAS_LABELS[i], value: n }));
  const wiekData = (d.d5_wiek || []).map((n, i) => ({ label: WIEK_LABELS[i], value: n }));
  const wykData  = (d.d5_wyk  || []).map((n, i) => ({ label: WYK_LABELS[i],  value: n }));
  const stazData = (d.d5_staz || []).map((n, i) => ({ label: STAZ_LABELS[i], value: n }));

  const kobiety   = d.d5_kobiety || 0;
  const mezczyzni = bezr - kobiety;
  const total     = kobiety + mezczyzni;

  // Kategorie — posortowane malejąco
  const allKat = [...(d.kategorie || [])].sort((a, b) => b.n - a.n)
    .map(k => ({ label: k.label, value: k.n, pct: k.pct }));

  const rawTrendMaz = stopa?.trend_maz_13m || [];

  const SHOW_N      = 12;
  // Do wykresu napływ/odpływ używamy RAW etykiet (w tym Lut 26 gdzie stopa=null)
  // żeby ostatni punkt był zawsze aktualny
  const allTrendLabels = rawTrendMaz.map(t => t.label);
  const napodLabels = allTrendLabels.slice(-SHOW_N);
  const trendZarej  = (d.trend_zarej_13m || []).slice(-SHOW_N);
  const trendWyrej  = (d.trend_wyrej_13m || []).slice(-SHOW_N);
  const wyrejTop5  = (d.wyrej_reasons || []).slice(0, 5);
  const aktywizacjaProgramowaPct = (() => {
    const row = (d.wyrej_reasons || []).find((r) => (r.label || '').toLowerCase().includes('szkolenie i staż'));
    if (row && typeof row.pct === 'number') return row.pct;
    return d.aktywizacja_pct ?? 0;
  })();

  // Stopa bezrobocia powiatu + delta vs poprzedni miesiąc
  const stopaArr   = (d.trend_stopa_13m || []).filter(v => v != null);
  const stopaCur   = d.stopa ?? null;
  const stopaPrev  = stopaArr.length >= 2 ? stopaArr[stopaArr.length - 2] : null;
  const stopaDelta = (stopaCur != null && stopaPrev != null)
    ? +(stopaCur - stopaPrev).toFixed(1) : null;
  const stopaDeltaType = stopaDelta == null ? 'eq' : stopaDelta >= 0 ? 'up' : 'dn';
  const stopaDeltaStr  = stopaDelta == null ? null
    : stopaDelta >= 0
      ? `↑ +${Math.abs(stopaDelta).toFixed(1).replace('.', ',')} pp vs. ${prevLabel}`
      : `↓ −${Math.abs(stopaDelta).toFixed(1).replace('.', ',')} pp vs. ${prevLabel}`;
  const stopaOkresAbbr = formatOkresAbbr(meta?.stopa_okres);

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Analiza powiatowa"
        sub={`MRPiPS-01 · ZUS · województwo mazowieckie · ${okresAbbr}`}
      />

      {/* Selector powiatu — z wyszukiwarką */}
      <PowiatDropdown
        options={options}
        value={wgm || ''}
        onChange={setSelWgm}
      />

      {/* ── Wiersz 1: 6 KPI ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '10px', flexShrink: 0, marginBottom: '10px',
      }}>
        <KpiCard compact flag="Stan końcowy"            flagColor="maz"
          target={bezr}               label="Zarejestrowanych"
          delta={fmtDelta(d.bezr_delta,   prevLabel)}
          deltaType={d.bezr_delta != null ? (d.bezr_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard compact flag="Zarejestrowani"          flagColor="pl"
          target={d.zarej_razem || 0} label="w miesiącu"
          delta={fmtDelta(d.zarej_delta,  prevLabel)}
          deltaType={d.zarej_delta != null ? (d.zarej_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard compact flag="Wyrejestrowani"          flagColor="green"
          target={wyrej}              label="w miesiącu"   variant="green"
          delta={fmtDelta(d.wyrej_delta,  prevLabel)}
          deltaType={d.wyrej_delta != null ? (d.wyrej_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard compact flag="Oferty pracy"            flagColor="green"
          target={d.oferty_pracy || 0} label="wolne miejsca" variant="green"
          delta={fmtDelta(d.oferty_delta, prevLabel)}
          deltaType={d.oferty_delta != null ? (d.oferty_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard compact flag="Pracujący ogółem"        flagColor="green" target={d.wyn_pracujacy || 0}    label="ZUS · I poł. 2025" variant="green" />
        <KpiCard compact flag="Śr. wynagrodzenie (UoP)" flagColor="green" target={Math.round(d.wyn_brutto || 0)} suffix=" zł" label="ZUS · I poł. 2025" variant="green" />
      </div>

      {/* ── Wiersz 2: Stopa (1/4) | Kategorie (3/8) | Charakterystyka (3/8) ──── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr',
        gap: '10px', minHeight: '280px', marginBottom: '10px',
      }}>

        {/* STOPA + AKTYWIZACJA + KOBIETY/MĘŻCZYŹNI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <KpiCard
            flag={stopaOkresAbbr || 'Stopa bezrobocia'} flagColor="maz"
            target={Math.round((stopaCur || 0) * 10)} decimals={1} suffix="%"
            label={`stopa bezrobocia · ${d.nazwa || ''}`}
            delta={stopaDeltaStr} deltaType={stopaDeltaType}
            variant={stopaDelta != null && stopaDelta > 0 ? 'red' : 'green'}
          />
          <KpiCard compact
            flag="Skuteczność aktywizacji" flagColor="green"
            target={Math.round((d.aktywizacja_pct ?? 0) * 10)} decimals={1} suffix="%"
            label="podjęli pracę / objęci aktywizacją"
            variant="green"
          />
          <Card title={`Płeć · ${d.nazwa || ''}`} grow>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <GenderFigure label="Kobiety"   n={kobiety}   total={total} color="#29b6a8" isFemale />
              <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0', flexShrink: 0 }} />
              <GenderFigure label="Mężczyźni" n={mezczyzni} total={total} color="#4895ef" isFemale={false} />
            </div>
          </Card>
        </div>

        {/* KATEGORIE */}
        <Card title={`Kategorie bezrobotnych · ${d.nazwa || ''}`} grow>
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

      {/* ── Wiersz 3: Napływ/Odpływ | Przyczyny ─────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '10px', minHeight: '290px', marginBottom: '10px',
      }}>

        {(() => {
          const napF = napFrom ?? napodLabels[0] ?? '';
          const napT = napTo   ?? napodLabels[napodLabels.length - 1] ?? '';
          const nfi  = napodLabels.indexOf(napF);
          const nti  = napodLabels.indexOf(napT);
          const nlo  = Math.min(nfi < 0 ? 0 : nfi, nti < 0 ? napodLabels.length - 1 : nti);
          const nhi  = Math.max(nfi < 0 ? 0 : nfi, nti < 0 ? napodLabels.length - 1 : nti);
          const slicedLabels = napodLabels.slice(nlo, nhi + 1);
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
              title="Napływ i odpływ"
              grow
              exportTitle={`naplyw_odplyw_${d.nazwa || 'powiat'}`}
              badge={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button style={btnStyle(showZarej, '#e63946')} onClick={() => setShowZarej(v => !v)}>Zarejestrowani</button>
                    <button style={btnStyle(showWyrej, '#4895ef')} onClick={() => setShowWyrej(v => !v)}>Wyrejestrowani</button>
                  </div>
                  <RangeSelector labels={napodLabels} from={napF} to={napT} onChange={(f, t) => { setNapFrom(f); setNapTo(t); }} />
                </div>
              }
            >
              <div ref={chartRef} style={{ height: '220px', overflow: 'hidden' }}>
                {napDatasets.length > 0 && trendZarej.some(v => v != null) && (
                  <LineChartSVG
                    datasets={napDatasets}
                    labels={slicedLabels}
                    height={Math.max(chartSize.h - 4, 100)}
                    width={Math.max(chartSize.w, 10)}
                  />
                )}
              </div>
            </Card>
          );
        })()}

        {wyrejTop5.length > 0 && (
          <Card title={`Przyczyny wyrejestrowania · ${d.nazwa || ''}`} grow>
            <WyrejDonut
              data={wyrejTop5.map(r => ({ label: r.label, value: r.n, pct: r.pct }))}
            />
          </Card>
        )}

      </div>

    </div>
  );
}
