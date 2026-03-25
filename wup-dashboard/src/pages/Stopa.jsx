import { useState } from 'react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid, Toggle } from '../components/Card';
import RankTable from '../components/RankTable';
import HorizontalBar, { stopaColor, greenColor } from '../components/HorizontalBar';
import LineChartSVG from '../components/LineChartSVG';
import InfoTooltip from '../components/InfoTooltip';
import { useAppData } from '../context/DataContext';
import { RangeSelector } from '../components/CustomSelect';


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
function fmtRRstopa(d) {
  if (d == null || isNaN(d)) return null;
  const abs = Math.abs(d).toFixed(1).replace('.', ',');
  return d >= 0 ? `r/r ↑ +${abs} pp` : `r/r ↓ \u2212${abs} pp`;
}

export default function Stopa() {
  const { stopa, meta, pulpit } = useAppData();
  const [rangeFrom, setRangeFrom] = useState(null);
  const [rangeTo,   setRangeTo]   = useState(null);

  if (!stopa) return null;

  const {
    pow_top5, pow_bot5, pow_max, pow_min,
    woj_stopa    = [],
    trend_pl_13m = [],
  } = stopa;

  const stopa_pl_val = stopa.stopa_pl ?? 5.4;

  // ── Trend stopy MAZ (pełny zakres) ───────────────────────────────────────
  const trend37All   = (pulpit?.trend_37m || []).filter(t => t.stopa != null);
  const trendAllLabels = trend37All.map(t => t.label);
  const DEFAULT_FROM = trendAllLabels.find(l => l.startsWith('Sty') && l.includes('25')) || trendAllLabels[0] || '';
  const tFrom = rangeFrom ?? DEFAULT_FROM;
  const tTo   = rangeTo   ?? trendAllLabels[trendAllLabels.length - 1] ?? '';
  const iFrom = trendAllLabels.indexOf(tFrom);
  const iTo   = trendAllLabels.indexOf(tTo);
  const lo = Math.min(iFrom < 0 ? 0 : iFrom, iTo < 0 ? trendAllLabels.length - 1 : iTo);
  const hi = Math.max(iFrom < 0 ? 0 : iFrom, iTo < 0 ? trendAllLabels.length - 1 : iTo);
  const trendSlice  = trend37All.slice(lo, hi + 1);
  const trendLabels = trendSlice.map(t => t.label);
  const trendData   = [{ data: trendSlice.map(t => t.stopa), color: '#4895ef', label: 'Mazowieckie' }];

  // Rankingi województw (woj_stopa posortowane desc z JSON)
  const WOJ_TOP5 = woj_stopa.slice(0, 5).map(d => ({ label: d.n, value: d.s }));
  const WOJ_BOT5 = woj_stopa.slice(-5).map(d => ({ label: d.n, value: d.s }));


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
          label={<>Ogółem kraj<InfoTooltip text="Stopa bezrobocia rejestrowanego — udział zarejestrowanych bezrobotnych w cywilnej ludności aktywnej zawodowo." source="GUS BDL" /></>}
          delta={fmtDeltaStopa(stopa.stopa_pl_delta, meta?.stopa_poprzedni_okres)}
          deltaType={stopa.stopa_pl_delta != null ? (stopa.stopa_pl_delta >= 0 ? 'up' : 'dn') : 'eq'}
          deltaRR={fmtRRstopa(stopa.stopa_pl_delta_rr)}
        />
        <KpiCard
          flag="Mazowieckie" flagColor="maz"
          target={Math.round(stopa.stopa_maz * 10)} decimals={1} suffix="%"
          label={<>Najniższa w PL<InfoTooltip text="Mazowieckie konsekwentnie notuje najniższą stopę bezrobocia wśród wszystkich województw." source="GUS BDL" /></>}
          delta={fmtDeltaStopa(stopa.stopa_maz_delta, meta?.stopa_poprzedni_okres)}
          deltaType={stopa.stopa_maz_delta != null ? (stopa.stopa_maz_delta >= 0 ? 'up' : 'dn') : 'eq'}
          deltaRR={fmtRRstopa(stopa.stopa_maz_delta_rr)}
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
          <RankTable data={pow_bot5} unit="%" accentColor="#52b788" reverse avgLine={stopa.stopa_maz} avgLabel="śr. MAZ" />
        </Card>
      </Grid>

      {/* Trend stopy MAZ */}
      {trendAllLabels.length > 0 && (
        <Card
          title={`Trend stopy bezrobocia — Mazowieckie (${trendAllLabels[0]}–${trendAllLabels[trendAllLabels.length - 1]})`}
          exportTitle="trend_stopy_mazowieckie"
          badge={
            <RangeSelector
              labels={trendAllLabels}
              from={tFrom}
              to={tTo}
              onChange={(f, t) => { setRangeFrom(f); setRangeTo(t); }}
            />
          }
        >
          <LineChartSVG
            datasets={trendData}
            labels={trendLabels}
            height={180}
            width={900}
            showValueLabels
            valueLabelMode="peaks"
          />
        </Card>
      )}

    </div>
  );
}
