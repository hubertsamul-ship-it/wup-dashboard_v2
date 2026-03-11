import { useState, useMemo, useEffect, useRef } from 'react';
import { Home, Clock, GraduationCap, Heart, Users, Shield } from 'lucide-react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import WyrejDonut from '../components/WyrejDonut';
import StatsSelector from '../components/StatsSelector';
import GenderFigure from '../components/GenderFigures';
import { useAppData } from '../context/DataContext';

const POW_COLORS = ['#e63946', '#4895ef', '#f4a261', '#52b788', '#a78bfa', '#fbbf24'];

const COLOR_F = '#29b6a8';
const COLOR_M = '#4895ef';

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
          fontSize: '0.62rem', color: '#475569', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.label}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', lineHeight: 1,
        }}>
          {fmt(item.value)}
        </div>
        <div style={{ fontSize: '0.57rem', color, fontWeight: 600 }}>
          {item.pct?.toFixed(1).replace('.', ',')}%
        </div>
      </div>
    </div>
  );
}

// ── Selektor powiatów do porównania ──────────────────────────────────────────
function PowiatSelector({ selected, onChange, allPowiaty, max = 6 }) {
  const [open, setOpen] = useState(false);
  const available = allPowiaty.filter(p => !selected.includes(p.wgm));
  const getName  = (wgm) => allPowiaty.find(p => p.wgm === wgm)?.nazwa || wgm;
  const getStopa = (wgm) => allPowiaty.find(p => p.wgm === wgm)?.stopa;

  const remove = (wgm) => { if (selected.length > 1) onChange(selected.filter(w => w !== wgm)); };
  const add    = (wgm) => { if (selected.length < max) onChange([...selected, wgm]); setOpen(false); };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' }}>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
      {selected.map((wgm, i) => (
        <div key={wgm} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px 3px 10px', borderRadius: '20px',
          background: `${POW_COLORS[i]}22`, border: `1px solid ${POW_COLORS[i]}66`,
          fontSize: '0.72rem', color: 'var(--text)',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: POW_COLORS[i], flexShrink: 0 }} />
          {getName(wgm)}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: POW_COLORS[i], marginLeft: '2px' }}>
            {getStopa(wgm)?.toFixed(1).replace('.', ',')}%
          </span>
          {selected.length > 1 && (
            <button
              onClick={() => remove(wgm)}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1, fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}
              title={`Usuń ${getName(wgm)}`}
            >×</button>
          )}
        </div>
      ))}
      {selected.length < max && (
        <div style={{ position: 'relative', zIndex: 100 }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px', color: 'var(--muted)', cursor: 'pointer', padding: '3px 12px',
              fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif', transition: 'all 0.15s',
            }}
          >+ Dodaj</button>
          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#1a2233', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', padding: '4px 0',
              maxHeight: '260px', overflowY: 'auto', minWidth: '210px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 101,
            }}>
              {available.map(p => (
                <button
                  key={p.wgm}
                  onClick={() => add(p.wgm)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                    color: 'var(--text)', padding: '6px 14px', fontSize: '0.75rem',
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span>{p.nazwa}</span>
                  <span style={{ color: 'var(--muted)', marginLeft: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem' }}>
                    {p.stopa?.toFixed(1).replace('.', ',')}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Główna strona ─────────────────────────────────────────────────────────────
export default function Powiaty({ initialPowiat = null }) {
  const { powiaty, stopa } = useAppData();
  const [chartRef, chartSize] = useContainerSize();

  const options = (powiaty || [])
    .sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'))
    .map(p => ({ value: p.wgm, label: p.nazwa }));

  const [selWgm, setSelWgm]   = useState(initialPowiat);
  const [cmpWgms, setCmpWgms] = useState([initialPowiat || '1465']);

  const defaultWgm = (powiaty || []).find(p => p.wgm === '1465')?.wgm || options[0]?.value || null;
  const wgm = selWgm || defaultWgm;

  useEffect(() => {
    if (wgm) setCmpWgms(prev => [wgm, ...prev.slice(1).filter(w => w !== wgm)]);
  }, [wgm]);

  const d = (powiaty || []).find(p => p.wgm === wgm) || {};

  if (!powiaty || powiaty.length === 0) return null;

  const bezr  = d.bezr_razem || 0;
  const wyrej = d.wyrej_razem || 0;

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

  // Trend etykiet: obetnij końcówkę, jeśli ostatni miesiąc nie ma stopy (np. luty 2026)
  const rawTrendMaz = stopa?.trend_maz_13m || [];
  const hasNullLast = rawTrendMaz.length > 0 && rawTrendMaz[rawTrendMaz.length - 1].stopa == null;
  const trendMaz    = hasNullLast ? rawTrendMaz.slice(0, -1) : rawTrendMaz;
  const trendLabels = trendMaz.map(t => t.label);

  const powSorted = useMemo(() =>
    [...(powiaty || [])].sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl')),
    [powiaty]
  );
  const stopaDatasets = useMemo(() =>
    cmpWgms.map((w, i) => {
      const p = (powiaty || []).find(x => x.wgm === w);
      const series = p?.trend_stopa_13m || [];
      const data   = hasNullLast ? series.slice(0, -1) : series;
      return { color: POW_COLORS[i % POW_COLORS.length], label: p?.nazwa || w, data };
    }),
    [cmpWgms, powiaty, hasNullLast]
  );

  const trendZarej = d.trend_zarej_13m || [];
  const trendWyrej = d.trend_wyrej_13m || [];
  const wyrejTop5  = (d.wyrej_reasons || []).slice(0, 5);

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Analiza powiatowa"
        sub="MRPiPS-01 · ZUS · województwo mazowieckie · Styczeń 2026"
      />

      {/* Selector powiatu */}
      <select
        value={wgm || ''}
        onChange={e => setSelWgm(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)', borderRadius: '10px',
          color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '0.82rem',
          cursor: 'pointer', appearance: 'none', marginBottom: '10px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        }}
      >
        {options.map(o => (
          <option
            key={o.value}
            value={o.value}
            style={{
              background: '#020617',
              color: '#e5e7eb',
            }}
          >
            {o.label}
          </option>
        ))}
      </select>

      {/* ── Wiersz 1: 6 KPI ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '10px', flexShrink: 0, marginBottom: '10px',
      }}>
        <KpiCard compact flag="Stan końcowy"            flagColor="maz"   target={bezr}                    label="Zarejestrowanych" />
        <KpiCard compact flag="Zarejestrowani"          flagColor="pl"    target={d.zarej_razem || 0}      label="w miesiącu" />
        <KpiCard compact flag="Wyrejestrowani"          flagColor="green" target={wyrej}                   label="w miesiącu"        variant="green" />
        <KpiCard compact flag="Oferty pracy"            flagColor="green" target={d.oferty_pracy || 0}     label="wolne miejsca"     variant="green" />
        <KpiCard compact flag="Pracujący ogółem"        flagColor="green" target={d.wyn_pracujacy || 0}    label="ZUS · I poł. 2025" variant="green" />
        <KpiCard compact flag="Śr. wynagrodzenie (UoP)" flagColor="green" target={Math.round(d.wyn_brutto || 0)} suffix=" zł" label="ZUS · I poł. 2025" variant="green" />
      </div>

      {/* ── Wiersz 2: Płeć (1/4) | Kategorie (3/8) | Charakterystyka (3/8) ──── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr',
        gap: '10px', height: '280px', marginBottom: '10px',
      }}>

        {/* PŁEĆ */}
        <Card title={`Płeć · ${d.nazwa || ''}`} grow>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
            <GenderFigure label="Kobiety"   n={kobiety}   total={total} color={COLOR_F} isFemale />
            <div style={{ width: '1px', background: 'rgba(0,0,0,0.06)', margin: '4px 0', flexShrink: 0 }} />
            <GenderFigure label="Mężczyźni" n={mezczyzni} total={total} color={COLOR_M} isFemale={false} />
          </div>
        </Card>

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
        gap: '10px', height: '290px', marginBottom: '10px',
      }}>

        <Card title="Napływ i odpływ — ostatnie 13 miesięcy" grow>
          <div ref={chartRef} style={{ flex: 1, minHeight: 0 }}>
            {trendZarej.some(v => v != null) && (
              <LineChartSVG
                datasets={[
                  { data: trendZarej, color: '#e63946', label: 'Zarejestrowani' },
                  { data: trendWyrej, color: '#4895ef', label: 'Wyrejestrowani' },
                ]}
                labels={trendLabels}
                height={Math.max(chartSize.h - 4, 100)}
                width={chartSize.w}
              />
            )}
          </div>
        </Card>

        {wyrejTop5.length > 0 && (
          <Card title={`Przyczyny wyrejestrowania · ${d.nazwa || ''}`} grow>
            <WyrejDonut
              data={wyrejTop5.map(r => ({ label: r.label, value: r.n, pct: r.pct }))}
            />
          </Card>
        )}

      </div>

      {/* ── Wiersz 4: Stopa bezrobocia — porównanie powiatów ─────────────────── */}
      <Card title="Stopa bezrobocia — porównanie powiatów" style={{ flexShrink: 0, marginBottom: '10px' }}>
        <div style={{ marginBottom: '10px' }}>
          <PowiatSelector
            selected={cmpWgms}
            onChange={setCmpWgms}
            allPowiaty={powSorted}
            max={6}
          />
        </div>
        <LineChartSVG datasets={stopaDatasets} labels={trendLabels} height={130} width={900} />
      </Card>

    </div>
  );
}
