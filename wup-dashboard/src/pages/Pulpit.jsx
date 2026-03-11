import { useState } from 'react';
import KpiCard from '../components/KpiCard';
import Card, { SectionHeader, Grid, Toggle } from '../components/Card';
import LineChartSVG from '../components/LineChartSVG';
import MapPoland from '../components/MapPoland';
import MapMazowieckie from '../components/MapMazowieckie';
import { useAppData } from '../context/DataContext';

const MONTHS_FULL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
];
const MONTHS_NOM = [
  'styczeń','luty','marzec','kwiecień','maj','czerwiec',
  'lipiec','sierpień','wrzesień','październik','listopad','grudzień',
];
const MONTHS_ABBR = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'];

function formatOkres(s) {
  if (!s) return '';
  const [y, m] = s.split('-').map(Number);
  return `${MONTHS_FULL[m - 1]} ${y}`;
}
function formatOkresAbbr(s) {
  if (!s) return '';
  const [y, m] = s.split('-').map(Number);
  return `${MONTHS_ABBR[m - 1]} ${y}`;
}
function miesiacNom(s) {
  if (!s) return 'poprzedni';
  const m = parseInt(s.split('-')[1], 10);
  return MONTHS_NOM[m - 1] ?? 'poprzedni';
}

function fmtLiczba(n) {
  return Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}
function formatDelta(n, prevOkres) {
  if (n == null || isNaN(n)) return '…';
  const abs = fmtLiczba(n);
  const label = miesiacNom(prevOkres);
  return n >= 0 ? `↑ +${abs} vs. ${label}` : `↓ −${abs} vs. ${label}`;
}
function formatDeltaStopa(n, prevOkres) {
  if (n == null || isNaN(n)) return '…';
  const abs = Math.abs(n).toFixed(1).replace('.', ',');
  const label = miesiacNom(prevOkres);
  return n >= 0 ? `↑ +${abs} pp vs. ${label}` : `↓ −${abs} pp vs. ${label}`;
}

export default function Pulpit({ onNavPowiaty }) {
  const [trendMode, setTrendMode] = useState('bezr');
  const { pulpit, meta, loading } = useAppData();

  if (!pulpit) return null;

  // Ukryj miesiące bez stopy (np. luty 2026, gdy brak danych GUS)
  const trendValid    = pulpit.trend_37m.filter(t => t.stopa != null);
  const trendLabels   = trendValid.map(t => t.label);
  const trendBezrData = [{ data: trendValid.map(t => t.bezr),  color: '#e63946' }];
  const trendStopaData= [{ data: trendValid.map(t => t.stopa), color: '#4895ef' }];
  const trendData     = trendMode === 'bezr' ? trendBezrData : trendStopaData;

  const bezrDelta  = pulpit.bezr_delta;
  const stopaDelta = pulpit.stopa_maz_delta;

  // Etykiety okresu z meta
  const stopaOkresAbbr = formatOkresAbbr(meta?.stopa_okres);
  const mrpipsOkres    = formatOkres(meta?.okres);

  return (
    <div className="page-scroll">
      <SectionHeader
        title="Rynek pracy w liczbach"
        sub={`Najświeższe dane · Polska i Województwo Mazowieckie · ${mrpipsOkres}`}
      />

      <Grid cols={4}>
        <KpiCard
          flag="Polska" flagColor="pl"
          target={pulpit.bezr_pl} label="Bezrobotnych ogółem"
          delta={formatDelta(pulpit.bezr_pl_delta, meta?.stopa_poprzedni_okres)}
          deltaType={pulpit.bezr_pl_delta != null ? (pulpit.bezr_pl_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard
          flag="Mazowieckie" flagColor="maz"
          target={loading ? 0 : pulpit.bezr_razem} label="Bezrobotnych w województwie"
          delta={loading ? '…' : formatDelta(bezrDelta, meta?.poprzedni_okres)}
          deltaType={bezrDelta != null ? (bezrDelta >= 0 ? 'up' : 'dn') : 'eq'}
          variant="red"
        />
        <KpiCard
          flag="Polska · GUS" flagColor="pl"
          target={Math.round(pulpit.stopa_pl * 10)} decimals={1} suffix="%"
          label="Stopa bezrobocia Polska"
          delta={formatDeltaStopa(pulpit.stopa_pl_delta, meta?.stopa_poprzedni_okres)}
          deltaType={pulpit.stopa_pl_delta != null ? (pulpit.stopa_pl_delta >= 0 ? 'up' : 'dn') : 'eq'}
        />
        <KpiCard
          flag="Mazowieckie · GUS" flagColor="maz"
          target={loading ? 0 : Math.round((pulpit.stopa_maz ?? 4.5) * 10)} decimals={1} suffix="%"
          label="Stopa bezrobocia woj."
          delta={loading ? '…' : formatDeltaStopa(stopaDelta, meta?.stopa_poprzedni_okres)}
          deltaType={stopaDelta != null ? (stopaDelta >= 0 ? 'up' : 'dn') : 'eq'}
          variant="green"
        />
      </Grid>

      <Grid cols={2} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Stopa bezrobocia — Polska" badge={stopaOkresAbbr} badgeLive>
          <MapPoland />
        </Card>
        <Card title="Stopa bezrobocia — powiaty mazowieckie" badge={stopaOkresAbbr} badgeLive>
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
