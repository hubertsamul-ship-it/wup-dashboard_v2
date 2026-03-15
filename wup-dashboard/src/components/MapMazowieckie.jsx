import { useState, useEffect, useMemo } from 'react';
import { useAppData } from '../context/DataContext';

// Nazwa z mrpips_data.json → GeoJSON nazwa (plik powiaty_maz.geojson)
// GeoJSON: powiaty ziemskie lowercase, miasta z wielką literą
const POW_MAP = {
  'Białobrzeski':        'powiat białobrzeski',
  'Ciechanowski':        'powiat ciechanowski',
  'Garwoliński':         'powiat garwoliński',
  'Gostyniński':         'powiat gostyniński',
  'Grodziski':           'powiat grodziski',
  'Grójecki':            'powiat grójecki',
  'Kozienicki':          'powiat kozienicki',
  'Legionowski':         'powiat legionowski',
  'Lipski':              'powiat lipski',
  'Łosicki':             'powiat łosicki',
  'Makowski':            'powiat makowski',
  'Miński':              'powiat miński',
  'Mławski':             'powiat mławski',
  'Nowodworski':         'powiat nowodworski',
  'Ostrołęcki':          'powiat ostrołęcki',
  'Ostrowski':           'powiat ostrowski',
  'Otwocki':             'powiat otwocki',
  'Piaseczyński':        'powiat piaseczyński',
  'Płocki':              'powiat płocki',
  'Płoński':             'powiat płoński',
  'Pruszkowski':         'powiat pruszkowski',
  'Przasnyski':          'powiat przasnyski',
  'Przysuski':           'powiat przysuski',
  'Pułtuski':            'powiat pułtuski',
  'Radomski':            'powiat radomski',
  'Siedlecki':           'powiat siedlecki',
  'Sierpecki':           'powiat sierpecki',
  'Sochaczewski':        'powiat sochaczewski',
  'Sokołowski':          'powiat sokołowski',
  'Szydłowiecki':        'powiat szydłowiecki',
  'Warszawski zachodni': 'powiat warszawski zachodni',
  'Węgrowski':           'powiat węgrowski',
  'Wołomiński':          'powiat wołomiński',
  'Wyszkowski':          'powiat wyszkowski',
  'Zwoleński':           'powiat zwoleński',
  'Żuromiński':          'powiat żuromiński',
  'Żyrardowski':         'powiat żyrardowski',
  'm. Ostrołęka':        'powiat Ostrołęka',
  'm. Płock':            'powiat Płock',
  'm. Radom':            'powiat Radom',
  'm. Siedlce':          'powiat Siedlce',
  'm. Warszawa':         'powiat Warszawa',
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
  const scale = Math.min(SVG_W / lonSpan, SVG_H / latSpan) * 0.92;
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
  '#EEF2FF', '#E0E7FF', '#C7D2FE', '#818CF8', '#4F46E5', '#3730A3', '#1E1B4B',
];

// Quantile breaks — dzieli posortowane wartości na 7 równych klas
function computeBreaks(values) {
  if (values.length < 2) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const breaks = [];
  for (let i = 1; i < 7; i++) {
    const idx = (i / 7) * (n - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    breaks.push(sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]));
  }
  return breaks;
}

// Zwraca kolor HEX dla podanej wartości stopy bezrobocia
function getChoroColor(value, breaks) {
  if (value == null || !breaks.length) return '#eef0f3';
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) return CHOROPLETH_COLORS[i];
  }
  return CHOROPLETH_COLORS[6];
}

export default function MapMazowieckie({ onPowiatClick }) {
  const { powiaty, loading } = useAppData();
  const [geoPaths, setGeoPaths] = useState([]);
  const [tooltip, setTooltip]   = useState(null);
  const [hovered, setHovered]   = useState(null);

  // Buduj lookup: GeoJSON nazwa → dane powiatu
  const dataByGeo = {};
  if (powiaty) {
    powiaty.forEach(p => {
      const geo = POW_MAP[p.nazwa];
      if (geo) dataByGeo[geo] = p;
    });
  }

  const stopaValues = powiaty?.filter(p => p.stopa != null).map(p => p.stopa) ?? [];
  const minS = stopaValues.length ? Math.min(...stopaValues) : 1;
  const maxS = stopaValues.length ? Math.max(...stopaValues) : 25;
  const breaks = useMemo(() => computeBreaks(stopaValues), [powiaty]);

  // Ładuj GeoJSON raz
  useEffect(() => {
    fetch('/data/powiaty_maz.geojson')
      .then(r => r.json())
      .then(data => {
        const bbox = calcBbox(data.features);
        const project = makeProject(bbox);
        setGeoPaths(data.features.map(f => ({
          d: geoToPath(f.geometry, project),
          geoNazwa: f.properties.nazwa,
        })));
      })
      .catch(e => console.error('GeoJSON load error:', e));
  }, []);

  const isEmpty = geoPaths.length === 0 || loading;

  return (
    <div style={{
      position: 'relative', background: '#F8FAFC', borderRadius: '10px', overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
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
          <strong style={{ fontSize: '0.78rem', color: '#1e293b' }}>{tooltip.nazwa}</strong><br />
          {tooltip.stopa != null
            ? <><span style={{ color: '#64748b' }}>Stopa: </span>
                <strong style={{ color: '#2c3e50', fontFamily: 'JetBrains Mono, monospace' }}>{tooltip.stopa.toFixed(1).replace('.', ',')}%</strong>
                &nbsp;·&nbsp;
                <span style={{ color: '#64748b' }}>Bezrob.: </span>
                <strong style={{ color: '#1e293b', fontFamily: 'JetBrains Mono, monospace' }}>
                  {tooltip.bezr != null
                    ? tooltip.bezr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
                    : '–'}
                </strong>
              </>
            : <span style={{ color: '#64748b' }}>brak danych</span>}
        </div>
      )}
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', display: 'block', height: 'auto' }}>
        {isEmpty && (
          <text x={SVG_W / 2} y={SVG_H / 2} textAnchor="middle"
            fill="var(--muted)" fontSize="13" fontFamily="Outfit, sans-serif">
            Ładowanie mapy…
          </text>
        )}
        {geoPaths.map((gp, i) => {
          const pow = dataByGeo[gp.geoNazwa];
          const hasData = pow && pow.stopa != null;
          const isHovered = hovered === gp.geoNazwa;
          return (
            <g key={i}
              style={{ cursor: hasData && onPowiatClick ? 'pointer' : 'default' }}
              onClick={() => {
                if (hasData && onPowiatClick) onPowiatClick({ n: pow.nazwa, s: pow.stopa, wgm: pow.wgm });
              }}
              onMouseEnter={e => {
                setHovered(gp.geoNazwa);
                const wrap = e.currentTarget.closest('div');
                const wr = wrap.getBoundingClientRect();
                setTooltip({
                  nazwa: pow?.nazwa ?? gp.geoNazwa.replace(/^powiat\s*/i, ''),
                  stopa: pow?.stopa,
                  bezr:  pow?.bezr_razem,
                  x: e.clientX - wr.left,
                  y: e.clientY - wr.top,
                });
              }}
              onMouseLeave={() => {
                setHovered(null);
                setTooltip(null);
              }}
            >
              <path
                d={gp.d}
                fill={isHovered ? '#FACC15' : (hasData ? getChoroColor(pow.stopa, breaks) : '#E2E8F0')}
                stroke="#FFFFFF"
                strokeWidth={isHovered ? '1.5' : '0.6'}
                style={{ transition: 'fill 0.2s, stroke-width 0.2s' }}
              />
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '0 4px' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
          Kliknij powiat = szczegóły
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
