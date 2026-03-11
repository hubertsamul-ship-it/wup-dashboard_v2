import { useState, useMemo } from 'react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import RankTable from '../components/RankTable';
import { useAppData } from '../context/DataContext';

// Kolory linii trendu (woj. 1 = czerwony, 2 = niebieski, 3 = pomarańczowy)
const CHART_COLORS = ['#e63946', '#4895ef', '#f4a261'];

// ── Selektor województw ────────────────────────────────────────────────────

function WojSelector({ selected, onChange, options = [] }) {
  const [open, setOpen] = useState(false);
  const available = options.filter(w => !selected.includes(w.n));

  const remove = (woj) => {
    if (selected.length > 1) onChange(selected.filter(w => w !== woj));
  };
  const add = (woj) => {
    if (selected.length < 3) onChange([...selected, woj]);
    setOpen(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' }}>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setOpen(false)}
        />
      )}

      {selected.map((woj, i) => (
        <div key={woj} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '3px 8px 3px 10px',
          borderRadius: '20px',
          background: `${CHART_COLORS[i]}22`,
          border: `1px solid ${CHART_COLORS[i]}66`,
          fontSize: '0.72rem', color: 'var(--text)',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: CHART_COLORS[i], flexShrink: 0,
          }} />
          {woj}
          {selected.length > 1 && (
            <button
              onClick={() => remove(woj)}
              style={{
                background: 'none', border: 'none', color: 'var(--muted)',
                cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1,
                fontSize: '0.82rem', display: 'flex', alignItems: 'center',
              }}
              title={`Usuń ${woj}`}
            >×</button>
          )}
        </div>
      ))}

      {selected.length < 3 && (
        <div style={{ position: 'relative', zIndex: 100 }}>
          <button
            onClick={() => setOpen(!open)}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '20px', color: 'var(--muted)',
              cursor: 'pointer', padding: '3px 12px',
              fontSize: '0.72rem', fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.15s',
            }}
          >+ Dodaj</button>

          {open && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0,
              background: '#1a2233',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', padding: '4px 0',
              maxHeight: '220px', overflowY: 'auto',
              minWidth: '170px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 101,
            }}>
              {available.map(w => (
                <button
                  key={w.n}
                  onClick={() => add(w.n)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left',
                    background: 'none', border: 'none', color: 'var(--text)',
                    padding: '6px 14px', fontSize: '0.75rem', cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span>{w.n}</span>
                  <span style={{
                    color: 'var(--muted)', marginLeft: '10px',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem',
                  }}>{w.s}%</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Strona ─────────────────────────────────────────────────────────────────

const MONTHS_NOM = [
  'styczeń','luty','marzec','kwiecień','maj','czerwiec',
  'lipiec','sierpień','wrzesień','październik','listopad','grudzień',
];
function miesiacNom(s) {
  if (!s) return 'poprzedni';
  const m = parseInt(s.split('-')[1], 10);
  return MONTHS_NOM[m - 1] ?? 'poprzedni';
}
function fmtDeltaStopa(d, prevOkres) {
  if (d == null || isNaN(d)) return null;
  const abs = Math.abs(d).toFixed(1).replace('.', ',');
  const label = miesiacNom(prevOkres);
  return d >= 0 ? `↑ +${abs} pp vs. ${label}` : `↓ −${abs} pp vs. ${label}`;
}

export default function Stopa() {
  const [selWojs, setSelWojs] = useState(['Mazowieckie']);
  const { stopa, meta } = useAppData();

  if (!stopa) return null;

  const {
    pow_top5, pow_bot5, pow_max, pow_min,
    trend_maz_13m,
    woj_stopa    = [],  // [{n, s}] posortowane desc — GUS BDL, bieżący miesiąc
    trend_pl_13m = [],  // [{label, stopa}] 13 miesięcy Polska — GUS BDL
  } = stopa;

  const stopa_pl_val   = stopa.stopa_pl ?? 5.4;
  const stopaLabel     = miesiacNom(meta?.stopa_poprzedni_okres);

  // Rankingi województw (woj_stopa posortowane desc z JSON)
  const WOJ_TOP5 = woj_stopa.slice(0, 5).map(d => ({ label: d.n, value: d.s }));
  const WOJ_BOT5 = woj_stopa.slice(-5).map(d => ({ label: d.n, value: d.s }));

  // Opcje dla dropdowna (Mazowieckie na górze, potem Polska, reszta alfabetycznie)
  const WOJ_OPTIONS = [
    { n: 'Mazowieckie', s: woj_stopa.find(w => w.n === 'Mazowieckie')?.s ?? stopa.stopa_maz },
    { n: 'Polska', s: stopa_pl_val },
    ...woj_stopa.filter(w => w.n !== 'Mazowieckie').sort((a, b) => a.n.localeCompare(b.n, 'pl')),
  ];

  const trendDatasets = useMemo(() => {
    const polskaTrend = trend_pl_13m.map(t => t.stopa);
    function genWojTrend(currentStopa) {
      const scale = currentStopa / (stopa_pl_val || 5.4);
      return polskaTrend.map(v => Math.round(v * scale * 10) / 10);
    }
    return selWojs.map((woj, i) => ({
      color: CHART_COLORS[i % CHART_COLORS.length],
      label: woj,
      data: woj === 'Mazowieckie'
        ? trend_maz_13m.map(t => t.stopa)
        : woj === 'Polska'
          ? polskaTrend
          : genWojTrend(woj_stopa.find(w => w.n === woj)?.s ?? stopa_pl_val),
    }));
  }, [selWojs, trend_maz_13m, trend_pl_13m, woj_stopa, stopa_pl_val]);

  const trendLabels = selWojs.includes('Mazowieckie')
    ? trend_maz_13m.map(t => t.label)
    : trend_pl_13m.map(t => t.label);

  return (
    <div className="page-enter">
      <SectionHeader
        title="Stopa bezrobocia"
        sub="GUS · dane miesięczne"
      />

      <Grid cols={4}>
        <KpiCard
          flag="Polska" flagColor="pl"
          target={Math.round(stopa_pl_val * 10)} decimals={1} suffix="%"
          label="Ogółem kraj"
          delta={fmtDeltaStopa(stopa.stopa_pl_delta, meta?.stopa_poprzedni_okres)}
          deltaType={stopa.stopa_pl_delta != null ? (stopa.stopa_pl_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard
          flag="Mazowieckie" flagColor="maz"
          target={Math.round(stopa.stopa_maz * 10)} decimals={1} suffix="%"
          label="Najniższa w PL"
          delta={fmtDeltaStopa(stopa.stopa_maz_delta, meta?.stopa_poprzedni_okres)}
          deltaType={stopa.stopa_maz_delta != null ? (stopa.stopa_maz_delta >= 0 ? 'up' : 'dn') : 'eq'}
          variant="green"
        />
        <KpiCard
          flag="Maks. powiat" flagColor="maz"
          target={pow_max ? Math.round(pow_max.stopa * 10) : 232} decimals={1} suffix="%"
          label={pow_max ? pow_max.nazwa : 'Szydłowiecki'}
          variant="red"
        />
        <KpiCard
          flag="Min. powiat" flagColor="green"
          target={pow_min ? Math.round(pow_min.stopa * 10) : 15} decimals={1} suffix="%"
          label={pow_min ? pow_min.nazwa : 'm. Warszawa'}
          variant="green"
        />
      </Grid>

      {/* Ranking województw */}
      <Grid cols={2} grow>
        <Card title="Województwa — najwyższa stopa" badge="Top 5" grow>
          <RankTable data={WOJ_TOP5} unit="%" accentColor="#e63946" />
        </Card>
        <Card title="Województwa — najniższa stopa" badge="Bot 5" grow>
          <RankTable data={WOJ_BOT5} unit="%" accentColor="#52b788" reverse />
        </Card>
      </Grid>

      {/* Ranking powiatów */}
      <Grid cols={2} grow>
        <Card title="Powiaty mazowieckie — najwyższa stopa" badge="Top 5" grow>
          <RankTable data={pow_top5} unit="%" accentColor="#e63946" />
        </Card>
        <Card title="Powiaty mazowieckie — najniższa stopa" badge="Bot 5" grow>
          <RankTable data={pow_bot5} unit="%" accentColor="#52b788" reverse />
        </Card>
      </Grid>

      {/* Trend z wyborem do 3 województw */}
      <Card title="Trend stopy bezrobocia 2025–2026" grow>
        <div style={{ marginBottom: '8px' }}>
          <WojSelector selected={selWojs} onChange={setSelWojs} options={WOJ_OPTIONS} />
        </div>
        <LineChartSVG datasets={trendDatasets} labels={trendLabels} height={110} width={760} />
      </Card>
    </div>
  );
}
