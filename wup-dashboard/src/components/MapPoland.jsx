import { useState, useEffect } from 'react';
import { useAppData } from '../context/DataContext';

// Display name (z woj_stopa JSON) → GeoJSON nazwa
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

function mazostColor(s, minS, maxS) {
  const t = Math.max(0, Math.min(1, (s - minS) / (maxS - minS)));
  const lo  = [253, 242, 240]; // #fdf2f0 — bardzo niskie
  const mid = [243, 166, 131]; // #f3a683 — średnie
  const hi  = [44,  62,  80];  // #2c3e50 — najwyższe
  const rgb = t < 0.5
    ? lo.map((v, i)  => Math.round(v + (t * 2) * (mid[i] - v)))
    : mid.map((v, i) => Math.round(v + ((t - 0.5) * 2) * (hi[i] - v)));
  return `rgb(${rgb.join(',')})`;
}

export default function MapPoland() {
  const [features, setFeatures] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const { stopa } = useAppData();

  // Buduj lookup z prawdziwych danych GUS
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

  // Ładuj geometrię GeoJSON raz
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

  // Łącz geometrię z danymi (reaktywnie)
  const paths = features.map(f => ({
    ...f,
    display: DISP_MAP[f.nazwa] || f.nazwa,
    stopa:   STOPA_MAP[f.nazwa] ?? null,
    isMaz:   f.nazwa === 'mazowieckie',
  }));

  return (
    <div style={{
      position: 'relative',
      background: '#ffffff',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      {tooltip && (
        <div style={{
          position: 'absolute', background: '#ffffff',
          border: '1.5px solid #2c3e50', borderRadius: '8px',
          padding: '8px 12px', fontSize: '0.72rem', color: '#1e293b',
          zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          left: tooltip.x + 12, top: tooltip.y - 10,
        }}>
          <strong style={{ color: '#1e293b' }}>{tooltip.display}</strong><br />
          {tooltip.stopa !== null
            ? <strong style={{ color: '#2c3e50', fontFamily: 'JetBrains Mono, monospace' }}>{tooltip.stopa.toFixed(1).replace('.', ',')}%</strong>
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
        {paths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill={p.stopa !== null ? mazostColor(p.stopa, minS, maxS) : '#eef0f3'}
            stroke={p.isMaz ? '#2c3e50' : 'white'}
            strokeWidth={p.isMaz ? 1.5 : 0.5}
            opacity={1}
            style={{ cursor: 'pointer', transition: 'opacity 0.12s' }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.82';
              const wrap = e.currentTarget.closest('div');
              const wr = wrap.getBoundingClientRect();
              setTooltip({ display: p.display, stopa: p.stopa, x: e.clientX - wr.left, y: e.clientY - wr.top });
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
              setTooltip(null);
            }}
          />
        ))}
      </svg>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '6px', padding: '0 4px',
      }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>Najazd = szczegóły · Mazowieckie = granatowa obwódka</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '5px', borderRadius: '3px', background: 'linear-gradient(to right, #fdf2f0, #f3a683, #2c3e50)' }} />
          <span style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{minS.toFixed(1).replace('.', ',')}% — {maxS.toFixed(1).replace('.', ',')}%</span>
        </div>
      </div>
    </div>
  );
}
