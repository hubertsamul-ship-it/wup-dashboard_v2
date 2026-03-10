import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid } from '../components/Card';
import HorizontalBar, { greenColor, stopaColor } from '../components/HorizontalBar';
import RankTable from '../components/RankTable';
import { useAppData } from '../context/DataContext';

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
    <div className="page-enter">
      <SectionHeader
        title="Wynagrodzenia"
        sub="ZUS · Blender Danych · województwo mazowieckie · I poł. 2025"
      />

      {/* KPI */}
      <Grid cols={3}>
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

      {/* Rankingi powiatów */}
      <Grid cols={2} grow>
        <Card title="TOP 5 powiatów wg wynagrodzenia" badge="Top 5" grow>
          <HorizontalBar data={toBar(top5_pow_wyn)} unit=" zł" colorFn={greenColor} />
        </Card>
        <Card title="5 powiatów z najniższym wynagrodzeniem" badge="Bot 5" grow>
          <HorizontalBar data={toBar(bot5_pow_wyn)} unit=" zł" colorFn={stopaColor} />
        </Card>
      </Grid>

      {/* Rankingi zawodów — TOP 5 */}
      <Grid cols={2} grow>
        <Card title="TOP 5 najlepiej opłacanych zawodów (min. 50 UoP)" badge="Top 5" grow>
          <RankTable data={toBar5(top10_zawody_best)} unit=" zł" accentColor="#52b788" />
        </Card>
        <Card title="TOP 5 najniżej opłacanych zawodów (min. 50 UoP)" badge="Bot 5" grow>
          <RankTable data={toBar5(top10_zawody_worst)} unit=" zł" accentColor="#e63946" reverse />
        </Card>
      </Grid>
    </div>
  );
}
