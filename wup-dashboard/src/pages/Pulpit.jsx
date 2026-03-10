import { useState } from 'react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid, Toggle } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import MapPoland from '../components/MapPoland';
import MapMazowieckie from '../components/MapMazowieckie';
import { useAppData } from '../context/DataContext';

function fmtLiczba(n) {
  return Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}
function formatDelta(n) {
  if (n == null || isNaN(n)) return '…';
  const abs = fmtLiczba(n);
  return n >= 0 ? `↑ +${abs} vs. grudzień` : `↓ −${abs} vs. grudzień`;
}
function formatDeltaStopa(n) {
  if (n == null || isNaN(n)) return '…';
  const abs = Math.abs(n).toFixed(1).replace('.', ',');
  return n >= 0 ? `↑ +${abs} pp vs. grudzień` : `↓ −${abs} pp vs. grudzień`;
}

export default function Pulpit({ onNavPowiaty }) {
  const [trendMode, setTrendMode] = useState('bezr');
  const { pulpit, loading } = useAppData();

  if (!pulpit) return null;

  const trendLabels   = pulpit.trend_37m.map(t => t.label);
  const trendBezrData = [{ data: pulpit.trend_37m.map(t => t.bezr),  color: '#e63946' }];
  const trendStopaData= [{ data: pulpit.trend_37m.map(t => t.stopa), color: '#4895ef' }];
  const trendData     = trendMode === 'bezr' ? trendBezrData : trendStopaData;

  const bezrDelta  = pulpit.bezr_delta;
  const stopaDelta = pulpit.stopa_maz_delta;

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Rynek pracy w liczbach"
        sub="Najświeższe dane · Polska i Województwo Mazowieckie · Styczeń 2026"
      />

      <Grid cols={4}>
        <KpiCard
          flag="Polska" flagColor="pl"
          target={pulpit.bezr_pl} label="Bezrobotnych ogółem"
          delta={formatDelta(pulpit.bezr_pl_delta)}
          deltaType={pulpit.bezr_pl_delta != null ? (pulpit.bezr_pl_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard
          flag="Mazowieckie" flagColor="maz"
          target={loading ? 0 : pulpit.bezr_razem} label="Bezrobotnych w województwie"
          delta={loading ? '…' : formatDelta(bezrDelta)}
          deltaType={bezrDelta != null ? (bezrDelta >= 0 ? 'up' : 'dn') : 'eq'}
          variant="red"
        />
        <KpiCard
          flag="Polska · GUS" flagColor="pl"
          target={Math.round(pulpit.stopa_pl * 10)} decimals={1} suffix="%"
          label="Stopa bezrobocia Polska"
          delta="↑ +0,3 pp vs. grudzień" deltaType="up"
        />
        <KpiCard
          flag="Mazowieckie · GUS" flagColor="maz"
          target={loading ? 0 : Math.round((pulpit.stopa_maz ?? 4.5) * 10)} decimals={1} suffix="%"
          label="Stopa bezrobocia woj."
          delta={loading ? '…' : formatDeltaStopa(stopaDelta)}
          deltaType={stopaDelta != null ? (stopaDelta >= 0 ? 'up' : 'dn') : 'eq'}
          variant="green"
        />
      </Grid>

      <Grid cols={2} style={{ gridTemplateColumns: '1fr 1.1fr' }}>
        <Card title="Stopa bezrobocia — Polska" badge="Sty 2026" badgeLive>
          <MapPoland />
        </Card>
        <Card title="Stopa bezrobocia — powiaty mazowieckie" badge="Sty 2026" badgeLive>
          <MapMazowieckie onPowiatClick={onNavPowiaty} />
        </Card>
      </Grid>

      <Card
        title="Trend bezrobocia — Mazowieckie 2023–2026"
        badge={
          <Toggle
            options={[{ id: 'bezr', label: 'Liczba' }, { id: 'stopa', label: 'Stopa %' }]}
            active={trendMode}
            onChange={setTrendMode}
          />
        }
      >
        <LineChartSVG datasets={trendData} labels={trendLabels} height={180} width={900} />
      </Card>
    </div>
  );
}
