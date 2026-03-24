import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import RankTable from '../components/RankTable';
import HorizontalBar, { stopaColor, greenColor } from '../components/HorizontalBar';
import InfoTooltip from '../components/InfoTooltip';
import { useAppData } from '../context/DataContext';


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
  const { stopa, meta } = useAppData();

  if (!stopa) return null;

  const {
    pow_top5, pow_bot5, pow_max, pow_min,
    woj_stopa    = [],
    trend_pl_13m = [],
  } = stopa;

  const stopa_pl_val = stopa.stopa_pl ?? 5.4;

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
          <RankTable data={pow_top5} unit="%" accentColor="#e63946" avgLine={stopa.stopa_maz} avgLabel="śr. MAZ" />
        </Card>
        <Card title="Powiaty mazowieckie — najniższa stopa" badge="Bot 5" grow>
          <RankTable data={pow_bot5} unit="%" accentColor="#52b788" reverse avgLine={stopa.stopa_maz} avgLabel="śr. MAZ" />
        </Card>
      </Grid>

    </div>
  );
}
