import { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../context/DataContext';

const WOJ_MAP = {
  'Warmińsko-maz.':  'warmińsko-mazurskie',
  'Podkarpackie':    'podkarpackie',
  'Świętokrzyskie':  'świętokrzyskie',
  'Lubelskie':       'lubelskie',
  'Kujawsko-pom.':   'kujawsko-pomorskie',
  'Zachodniopom.':   'zachodniopomorskie',
  'Podlaskie':       'podlaskie',
  'Opolskie':        'opolskie',
  'Łódzkie':         'łódzkie',
  'Lubuskie':        'lubuskie',
  'Dolnośląskie':    'dolnośląskie',
  'Pomorskie':       'pomorskie',
  'Małopolskie':     'małopolskie',
  'Śląskie':         'śląskie',
  'Mazowieckie':     'mazowieckie',
  'Wielkopolskie':   'wielkopolskie',
};

const SVG_W = 500, SVG_H = 390;
const MID_LAT_RAD = 52 * Math.PI / 180;

function calcBbox(features) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const scan = ([lon, lat]) => {
    if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  };
  for (const f of features) {
    const g = f.geometry;
    const rings = g.type === 'Polygon' ? g.coordinates
                : g.type === 'MultiPolygon' ? g.coordinates.flat()
                : [];
    rings.forEach(r => r.forEach(scan));
  }
  return { minLon, maxLon, minLat, maxLat };
}

function makeProject(bbox) {
  const cos = Math.cos(MID_LAT_RAD);
  const lonSpan = (bbox.maxLon - bbox.minLon) * cos;
  const latSpan = bbox.maxLat - bbox.minLat;
  const pad = 0.05;
  const scale = Math.min(SVG_W / lonSpan, SVG_H / latSpan) * (1 - pad * 2);
  const offX = (SVG_W - lonSpan * scale) / 2;
  const offY = (SVG_H - latSpan * scale) / 2;
  return ([lon, lat]) => [
    (lon - bbox.minLon) * cos * scale + offX,
    (bbox.maxLat - lat) * scale + offY,
  ];
}

function geoToPath(geometry, project) {
  const ringToD = ring =>
    ring.map((pt, i) => `${i ? 'L' : 'M'}${project(pt).map(v => v.toFixed(1)).join(',')}`).join('') + 'Z';
  if (geometry.type === 'Polygon')
    return geometry.coordinates.map(ringToD).join(' ');
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.flatMap(poly => poly.map(ringToD)).join(' ');
  return '';
}

const CHOROPLETH_COLORS = [
  '#caf0f8', '#90e0ef', '#48cae4', '#00b4d8', '#0077b6', '#023e8a', '#03045e',
];

function jenksBreaks(values, k = 7) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n <= k) return sorted.slice(0, n - 1);

  const lcl = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0));
  const vcl = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(Infinity));
  for (let i = 1; i <= k; i++) { lcl[1][i] = 1; vcl[1][i] = 0; }

  for (let l = 2; l <= n; l++) {
    let sum = 0, sumSq = 0, w = 0;
    for (let m = 1; m <= l; m++) {
      const idx = l - m + 1;
      const v = sorted[idx - 1];
      w++; sum += v; sumSq += v * v;
      const variance = sumSq - sum * sum / w;
      if (idx > 1) {
        for (let j = 2; j <= k; j++) {
          const cost = variance + vcl[idx - 1][j - 1];
          if (cost < vcl[l][j]) { vcl[l][j] = cost; lcl[l][j] = idx; }
        }
      }
    }
    lcl[l][1] = 1;
    vcl[l][1] = sumSq - sum * sum / w;
  }

  const breaks = new Array(k);
  breaks[k - 1] = sorted[n - 1];
  let pos = n;
  for (let j = k; j >= 2; j--) {
    breaks[j - 2] = sorted[lcl[pos][j] - 2];
    pos = lcl[pos][j] - 1;
  }
  return breaks.slice(0, k - 1);
}

function getChoroColor(value, breaks) {
  if (value == null || !breaks.length) return '#E2E8F0';
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return CHOROPLETH_COLORS[i];
  }
  return CHOROPLETH_COLORS[6];
}

export default function MapPoland({ onMazClick }) {
  const [features, setFeatures] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);
  const { stopa } = useAppData();

  const wojData = stopa?.woj_stopa ?? [];
  const STOPA_MAP = Object.fromEntries(
    wojData.map(d => [WOJ_MAP[d.n], d.s]).filter(([k]) => k != null)
  );
  const DISP_MAP = Object.fromEntries(
    wojData.map(d => [WOJ_MAP[d.n], d.n]).filter(([k]) => k != null)
  );
  const stopaValues = wojData.map(d => d.s).filter(v => v != null);
  const minS = stopaValues.length ? Math.min(...stopaValues) : 2;
  const maxS = stopaValues.length ? Math.max(...stopaValues) : 12;
  const breaks = useMemo(() => jenksBreaks(stopaValues), [stopa]);

  useEffect(() => {
    fetch('/data/wojewodztwa.geojson')
      .then(r => r.json())
      .then(data => {
        const bbox = calcBbox(data.features);
        const project = makeProject(bbox);
        setFeatures(data.features.map(f => ({
          d: geoToPath(f.geometry, project),
          nazwa: f.properties.nazwa,
        })));
      })
      .catch(e => console.error('GeoJSON load error:', e));
  }, []);

  const paths = features.map(f => ({
    ...f,
    display: DISP_MAP[f.nazwa] || f.nazwa,
    stopa:   STOPA_MAP[f.nazwa] ?? null,
    isMaz:   f.nazwa === 'mazowieckie',
  }));

  return (
    <div style={{
      position: 'relative',
      background: '#F8F9FA',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    }}>
      {tooltip && (
        <div style={{
          position: 'absolute', background: '#ffffff',
          border: '1.5px solid #C7D2FE', borderRadius: '8px',
          padding: '8px 12px', fontSize: '0.72rem', color: '#1e293b',
          zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          left: tooltip.x + 12, top: tooltip.y - 10,
        }}>
          <strong style={{ color: '#1e293b' }}>{tooltip.display}</strong><br />
          {tooltip.stopa !== null
            ? <strong style={{ color: '#1E40AF', fontFamily: 'JetBrains Mono, monospace' }}>{tooltip.stopa.toFixed(1).replace('.', ',')}%</strong>
            : <span style={{ color: '#64748b' }}>brak danych</span>}
        </div>
      )}
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', display: 'block', height: 'auto' }}
      >
        {features.length === 0 && (
          <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle" fill="var(--muted)" fontSize="13" fontFamily="Outfit, sans-serif">
            Ładowanie mapy…
          </text>
        )}
        {[...paths.filter(p => !p.isMaz), ...paths.filter(p => p.isMaz)].map((p, i) => {
          const isHovered = hovered === p.nazwa;
          return (
            <path
              key={i}
              d={p.d}
              fill={isHovered ? '#FACC15' : (p.stopa !== null ? getChoroColor(p.stopa, breaks) : '#E2E8F0')}
              stroke="#FFFFFF"
              strokeWidth={isHovered ? '1.5' : '0.8'}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                filter: isHovered ? 'drop-shadow(0 0 8px rgba(250,204,21,0.5))' : 'none',
              }}
              onMouseEnter={e => {
                setHovered(p.nazwa);
                const wrap = e.currentTarget.closest('div');
                const wr = wrap.getBoundingClientRect();
                setTooltip({ display: p.display, stopa: p.stopa, x: e.clientX - wr.left, y: e.clientY - wr.top });
              }}
              onMouseLeave={() => { setHovered(null); setTooltip(null); }}
              onClick={p.isMaz && onMazClick ? () => onMazClick() : undefined}
            />
          );
        })}
      </svg>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '6px', padding: '0 4px',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
          Mazowieckie{onMazClick ? ' · kliknij = szczegóły' : ' · najazd = szczegóły'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--muted)', marginRight: '2px' }}>{minS.toFixed(1).replace('.', ',')}%</span>
          {CHOROPLETH_COLORS.map(c => (
            <div key={c} style={{ width: '12px', height: '8px', borderRadius: '2px', background: c, border: '0.5px solid rgba(0,0,0,0.08)' }} />
          ))}
          <span style={{ fontSize: '0.62rem', color: 'var(--muted)', marginLeft: '2px' }}>{maxS.toFixed(1).replace('.', ',')}%</span>
        </div>
      </div>
    </div>
  );
}
