/**
 * Labour Pulse Matrix™ — flagowy wykres analizy rynku pracy
 * 
 * Wymiary:
 * - Oś X: Dynamika bezrobocia (YoY pp) — zmiana stopy bezrobocia rok do roku
 * - Oś Y: Dynamika popytu na pracę (YoY %) — zmiana liczby ofert pracy
 * - Rozmiar bąbla: Liczba bezrobotnych (skala problemu)
 * - Kolor: Ryzyko strukturalne (długotrwali + mismatch)
 * 
 * Kwadranty:
 * - STABILNY (bezrobocie ↓, popyt ↑) — zielony
 * - PRESSURE (bezrobocie ↑, popyt ↑) — żółty  
 * - ALARM (bezrobocie ↑, popyt ↓) — czerwony
 * - OPPORTUNITY (bezrobocie ↓, popyt ↓) — niebieski
 */
import { useState, useMemo } from 'react';

// Kwadranty narracji
const QUADRANTS = {
  stable:      { label: 'Stabilny',    color: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
  pressure:    { label: 'Presja',      color: '#eab308', bg: 'rgba(234,179,8,0.06)' },
  alarm:       { label: 'Alarm',       color: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
  opportunity: { label: 'Szansa',      color: '#2563eb', bg: 'rgba(37,99,235,0.06)' },
};

function getQuadrant(deltaUnemployment, deltaDemand) {
  if (deltaUnemployment <= 0 && deltaDemand >= 0) return 'stable';
  if (deltaUnemployment > 0 && deltaDemand >= 0) return 'pressure';
  if (deltaUnemployment > 0 && deltaDemand < 0) return 'alarm';
  return 'opportunity';
}

function getRiskColor(riskScore) {
  // riskScore 0-100
  if (riskScore >= 70) return '#dc2626'; // czerwony — wysokie ryzyko
  if (riskScore >= 40) return '#f97316'; // pomarańczowy — średnie
  if (riskScore >= 20) return '#eab308'; // żółty — niskie-średnie
  return '#16a34a'; // zielony — niskie
}

function fmt(v, decimals = 1) {
  if (v == null || isNaN(v)) return '—';
  const abs = Math.abs(v).toFixed(decimals).replace('.', ',');
  return v >= 0 ? `+${abs}` : `−${abs}`;
}

function fmtCount(n) {
  if (n == null) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

export default function LabourPulseMatrix({
  data = [],           // [{ name, deltaUnemployment, deltaDemand, unemployed, riskScore, isHighlighted }]
  highlightedId = null,
  onBubbleClick,
  width = 600,
  height = 400,
  showQuadrantLabels = true,
  title = 'Labour Pulse Matrix™',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const W = width;
  const H = height;
  const pad = { t: 40, b: 50, l: 60, r: 30 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  // Oblicz zakres osi na podstawie danych
  const { xMin, xMax, yMin, yMax, maxUnemployed } = useMemo(() => {
    if (!data.length) return { xMin: -3, xMax: 3, yMin: -30, yMax: 30, maxUnemployed: 10000 };
    
    const xs = data.map(d => d.deltaUnemployment).filter(v => v != null);
    const ys = data.map(d => d.deltaDemand).filter(v => v != null);
    const us = data.map(d => d.unemployed).filter(v => v != null);
    
    const rawXMin = Math.min(...xs, 0);
    const rawXMax = Math.max(...xs, 0);
    const rawYMin = Math.min(...ys, 0);
    const rawYMax = Math.max(...ys, 0);
    
    const xSpread = Math.max(Math.abs(rawXMin), Math.abs(rawXMax), 1);
    const ySpread = Math.max(Math.abs(rawYMin), Math.abs(rawYMax), 10);
    
    return {
      xMin: -xSpread * 1.3,
      xMax: xSpread * 1.3,
      yMin: -ySpread * 1.3,
      yMax: ySpread * 1.3,
      maxUnemployed: Math.max(...us, 1000),
    };
  }, [data]);

  const xPos = (v) => pad.l + ((v - xMin) / (xMax - xMin)) * iW;
  const yPos = (v) => pad.t + iH - ((v - yMin) / (yMax - yMin)) * iH;
  const centerX = xPos(0);
  const centerY = yPos(0);

  // Rozmiar bąbla na podstawie liczby bezrobotnych
  const bubbleSize = (unemployed) => {
    const minR = 8;
    const maxR = 35;
    const ratio = Math.sqrt(unemployed / maxUnemployed);
    return minR + ratio * (maxR - minR);
  };

  const handleMouseMove = (e, idx) => {
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    setHoveredIdx(idx);
  };

  // Sortuj bąble: większe na spód, mniejsze na wierzch
  const sortedData = useMemo(() => {
    return [...data]
      .map((d, i) => ({ ...d, originalIdx: i }))
      .sort((a, b) => (b.unemployed || 0) - (a.unemployed || 0));
  }, [data]);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, display: 'block', overflow: 'visible' }}
      >
        {/* Tło kwadrantów */}
        <rect x={pad.l} y={pad.t} width={centerX - pad.l} height={centerY - pad.t} fill={QUADRANTS.pressure.bg} />
        <rect x={centerX} y={pad.t} width={pad.l + iW - centerX} height={centerY - pad.t} fill={QUADRANTS.alarm.bg} />
        <rect x={pad.l} y={centerY} width={centerX - pad.l} height={pad.t + iH - centerY} fill={QUADRANTS.stable.bg} />
        <rect x={centerX} y={centerY} width={pad.l + iW - centerX} height={pad.t + iH - centerY} fill={QUADRANTS.opportunity.bg} />

        {/* Osie */}
        <line x1={pad.l} y1={centerY} x2={pad.l + iW} y2={centerY} stroke="var(--border)" strokeWidth="1" />
        <line x1={centerX} y1={pad.t} x2={centerX} y2={pad.t + iH} stroke="var(--border)" strokeWidth="1" />

        {/* Ramka wykresu */}
        <rect x={pad.l} y={pad.t} width={iW} height={iH} fill="none" stroke="var(--border)" strokeWidth="1" />

        {/* Etykiety kwadrantów */}
        {showQuadrantLabels && (
          <>
            <text x={pad.l + 10} y={pad.t + 18} fontSize="10" fill={QUADRANTS.pressure.color} fontWeight="600" fontFamily="Outfit, sans-serif">PRESJA</text>
            <text x={pad.l + iW - 10} y={pad.t + 18} fontSize="10" fill={QUADRANTS.alarm.color} fontWeight="600" textAnchor="end" fontFamily="Outfit, sans-serif">ALARM</text>
            <text x={pad.l + 10} y={pad.t + iH - 8} fontSize="10" fill={QUADRANTS.stable.color} fontWeight="600" fontFamily="Outfit, sans-serif">STABILNY</text>
            <text x={pad.l + iW - 10} y={pad.t + iH - 8} fontSize="10" fill={QUADRANTS.opportunity.color} fontWeight="600" textAnchor="end" fontFamily="Outfit, sans-serif">SZANSA</text>
          </>
        )}

        {/* Etykiety osi */}
        <text x={pad.l + iW / 2} y={H - 8} fontSize="10" fill="var(--muted)" textAnchor="middle" fontFamily="Outfit, sans-serif">
          Dynamika bezrobocia (YoY pp)
        </text>
        <text x={14} y={pad.t + iH / 2} fontSize="10" fill="var(--muted)" textAnchor="middle" fontFamily="Outfit, sans-serif" transform={`rotate(-90, 14, ${pad.t + iH / 2})`}>
          Dynamika popytu (YoY %)
        </text>

        {/* Siatka pomocnicza */}
        {[-2, -1, 1, 2].map((v) => {
          const x = xPos(v);
          if (x < pad.l || x > pad.l + iW) return null;
          return (
            <g key={`x-${v}`}>
              <line x1={x} y1={pad.t} x2={x} y2={pad.t + iH} stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="3,3" />
              <text x={x} y={H - 32} fontSize="9" fill="var(--muted2)" textAnchor="middle" fontFamily="JetBrains Mono, monospace">{fmt(v, 0)}</text>
            </g>
          );
        })}
        {[-20, -10, 10, 20].map((v) => {
          const y = yPos(v);
          if (y < pad.t || y > pad.t + iH) return null;
          return (
            <g key={`y-${v}`}>
              <line x1={pad.l} y1={y} x2={pad.l + iW} y2={y} stroke="rgba(0,0,0,0.04)" strokeWidth="1" strokeDasharray="3,3" />
              <text x={pad.l - 6} y={y + 3} fontSize="9" fill="var(--muted2)" textAnchor="end" fontFamily="JetBrains Mono, monospace">{fmt(v, 0)}%</text>
            </g>
          );
        })}

        {/* Zero labels */}
        <text x={centerX} y={H - 32} fontSize="9" fill="var(--muted)" textAnchor="middle" fontFamily="JetBrains Mono, monospace">0</text>
        <text x={pad.l - 6} y={centerY + 3} fontSize="9" fill="var(--muted)" textAnchor="end" fontFamily="JetBrains Mono, monospace">0%</text>

        {/* Bąble */}
        {sortedData.map((d, i) => {
          const cx = xPos(d.deltaUnemployment ?? 0);
          const cy = yPos(d.deltaDemand ?? 0);
          const r = bubbleSize(d.unemployed || 0);
          const color = getRiskColor(d.riskScore ?? 30);
          const isHovered = hoveredIdx === d.originalIdx;
          const isHighlighted = d.isHighlighted || d.id === highlightedId;

          return (
            <g key={d.id || i}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? r + 3 : r}
                fill={color}
                fillOpacity={isHighlighted ? 0.85 : 0.55}
                stroke={isHighlighted ? 'var(--nav-active)' : isHovered ? color : 'white'}
                strokeWidth={isHighlighted ? 3 : isHovered ? 2 : 1.5}
                style={{ cursor: 'pointer', transition: 'r 0.15s, stroke-width 0.15s' }}
                onMouseEnter={(e) => handleMouseMove(e, d.originalIdx)}
                onMouseMove={(e) => handleMouseMove(e, d.originalIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onBubbleClick?.(d)}
              />
              {/* Etykieta dla większych bąbli lub wyróżnionych */}
              {(r > 18 || isHighlighted) && !isHovered && (
                <text
                  x={cx}
                  y={cy + 3}
                  fontSize="9"
                  fill="#ffffff"
                  textAnchor="middle"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="600"
                  style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {d.shortName || d.name?.substring(0, 6) || ''}
                </text>
              )}
            </g>
          );
        })}

        {/* Tytuł */}
        <text x={pad.l} y={20} fontSize="13" fill="var(--text)" fontWeight="600" fontFamily="Outfit, sans-serif">{title}</text>
        <text x={pad.l} y={32} fontSize="9" fill="var(--muted2)" fontFamily="Outfit, sans-serif">Powiaty woj. mazowieckiego</text>
      </svg>

      {/* Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 10,
            background: 'var(--card-bg)',
            border: '1px solid var(--card-br)',
            borderRadius: '10px',
            padding: '12px 14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            pointerEvents: 'none',
            zIndex: 100,
            minWidth: '180px',
            transform: tooltipPos.x > W - 200 ? 'translateX(-110%)' : 'none',
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            {data[hoveredIdx].name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Bezrobotni:</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--text)' }}>
                {fmtCount(data[hoveredIdx].unemployed)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Dyn. bezrob. (YoY):</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: data[hoveredIdx].deltaUnemployment > 0 ? '#dc2626' : '#16a34a' }}>
                {fmt(data[hoveredIdx].deltaUnemployment)} pp
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted)' }}>
              <span>Dyn. popytu (YoY):</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: data[hoveredIdx].deltaDemand > 0 ? '#16a34a' : '#dc2626' }}>
                {fmt(data[hoveredIdx].deltaDemand)}%
              </span>
            </div>
          </div>
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border)',
            fontSize: '0.68rem',
            color: 'var(--muted2)',
          }}>
            Kwadrant: <span style={{ fontWeight: 600, color: QUADRANTS[getQuadrant(data[hoveredIdx].deltaUnemployment, data[hoveredIdx].deltaDemand)].color }}>
              {QUADRANTS[getQuadrant(data[hoveredIdx].deltaUnemployment, data[hoveredIdx].deltaDemand)].label}
            </span>
          </div>
        </div>
      )}

      {/* Legenda */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '12px',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#16a34a', opacity: 0.6 }} />
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#16a34a', opacity: 0.4 }} />
          </div>
          <span>Rozmiar = liczba bezrobotnych</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--muted)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a' }} />
          <span>Niskie ryzyko</span>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
          <span>Średnie</span>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316' }} />
          <span>Wysokie</span>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626' }} />
          <span>Krytyczne</span>
        </div>
      </div>
    </div>
  );
}
