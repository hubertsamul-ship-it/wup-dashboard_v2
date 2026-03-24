// Pure SVG line chart matching the mockup aesthetic exactly
import { useState } from 'react';

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return '100,100,100';
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `${r},${g},${b}`;
}

function fmt(v) {
  if (v == null || Number.isNaN(v)) return '—';
  if (v >= 10000) return Math.round(v / 1000) + 'k';
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.', ',') + 'k';
  return v % 1 !== 0 ? v.toFixed(1).replace('.', ',') : String(Math.round(v));
}

export default function LineChartSVG({
  datasets,        // [{ data: [...], color: '#e63946', label: '' }]
  labels,          // x-axis labels
  height = 160,
  width = 560,
  showLegend = true,
  showValueLabels = false,
  valueLabelMode = 'last', // 'last' | 'all'
  valueFormatter,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const W = width, H = height;
  const hasLabels = showLegend && datasets.some(d => d.label);
  const pad = { t: hasLabels ? 38 : 16, b: 32, l: 52, r: 16 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const allVals = datasets
    .flatMap(d => d.data)
    .filter(v => typeof v === 'number' && Number.isFinite(v));
  const rawMin = allVals.length ? Math.min(...allVals) : 0;
  const rawMax = allVals.length ? Math.max(...allVals) : 1;
  const spread = rawMax - rawMin || rawMax * 0.1;
  const mn = rawMin - spread * 0.1;
  const mx = rawMax + spread * 0.1;
  const n = labels.length;
  const valueFmt = valueFormatter || fmt;

  const xPos = (i) => {
    if (n <= 1) return pad.l + iW / 2;
    return pad.l + (i / (n - 1)) * iW;
  };
  const yPos = (v) => pad.t + iH - ((v - mn) / (mx - mn)) * iH;

  const gridLines = [];
  for (let i = 0; i <= 3; i++) {
    const v = mn + (mx - mn) * (i / 3);
    const yy = yPos(v);
    gridLines.push({ v, yy });
  }

  const step = Math.max(1, Math.ceil(Math.max(n, 1) / 6));
  const baseIdxs = n > 0 ? labels.map((_, i) => i).filter((i) => i % step === 0) : [];
  const lastBase = baseIdxs[baseIdxs.length - 1] ?? -Infinity;
  const xLabelIdxs = (n > 0 && !baseIdxs.includes(n - 1) && (n - 1 - lastBase) >= Math.floor(step * 0.6))
    ? [...baseIdxs, n - 1]
    : baseIdxs;

  // ── Tooltip ──────────────────────────────────────────────────────────────
  const renderTooltip = () => {
    if (hoveredIdx === null) return null;
    const x = xPos(hoveredIdx);
    const TW = 122;
    const TH = 18 + datasets.length * 17;
    // Flip to left side if near right edge
    const tipX = x + 10 + TW > W - pad.r ? x - TW - 10 : x + 10;
    const tipY = pad.t + 2;

    return (
      <g pointerEvents="none">
        {/* Vertical guide line */}
        <line
          x1={x.toFixed(1)} y1={pad.t}
          x2={x.toFixed(1)} y2={(pad.t + iH).toFixed(1)}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth="1"
          strokeDasharray="4,3"
        />
        {/* Tooltip background */}
        <rect
          x={tipX} y={tipY}
          width={TW} height={TH}
          rx="6" ry="6"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="1"
          filter="url(#tooltip-shadow)"
        />
        {/* Label (period) */}
        <text
          x={tipX + 9} y={tipY + 12}
          fontSize="8" fill="#94a3b8"
          fontFamily="JetBrains Mono, monospace"
        >
          {labels[hoveredIdx]}
        </text>
        {/* Dataset rows */}
        {datasets.map((ds, di) => {
          const v = ds.data[hoveredIdx];
          const col = ds.color || '#2563eb';
          const rowY = tipY + 16 + (di + 1) * 17;
          return (
            <g key={di}>
              <circle cx={tipX + 11} cy={rowY - 3} r="3" fill={col} />
              <text
                x={tipX + 20} y={rowY}
                fontSize="9.5" fill="#1e293b"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="700"
              >
                {v == null || Number.isNaN(v) ? '—' : valueFmt(v)}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', overflow: 'visible', display: 'block' }}
    >
      <defs>
        <filter id="tooltip-shadow" x="-15%" y="-15%" width="130%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="rgba(0,0,0,0.10)" />
        </filter>
      </defs>

      {/* Grid lines */}
      {gridLines.map(({ v, yy }, i) => (
        <g key={i}>
          <line
            x1={pad.l} y1={yy.toFixed(1)}
            x2={pad.l + iW} y2={yy.toFixed(1)}
            stroke="#e2e8f0" strokeWidth="1"
          />
          <text
            x={pad.l - 5} y={(yy + 4).toFixed(1)}
            textAnchor="end" fontSize="9" fill="#64748b"
            fontFamily="JetBrains Mono, monospace"
          >
            {fmt(v)}
          </text>
        </g>
      ))}

      {/* X labels */}
      {xLabelIdxs.map((idx, i) => (
        <text
          key={i}
          x={xPos(idx).toFixed(1)} y={H - 6}
          textAnchor="middle" fontSize="9" fill="#64748b"
          fontFamily="JetBrains Mono, monospace"
        >
          {labels[idx]}
        </text>
      ))}

      {/* Datasets */}
      {datasets.map((ds, di) => {
        const col = ds.color || '#4895ef';
        const rgb = hexToRgb(col);
        const isGhost = ds.ghost === true;
        const vals = ds.data.filter(v => v != null);
        if (vals.length === 0) return null;

        // Build path only for non-null values aligned to their indices
        const allValsWithIdx = ds.data.map((v, i) => ({ v, i })).filter(pt => pt.v != null);
        let path = '';
        allValsWithIdx.forEach(({ v, i }, pi) => {
          if (pi === 0) {
            path = `M${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`;
          } else {
            const prev = allValsWithIdx[pi - 1];
            const cpx = (xPos(prev.i) + xPos(i)) / 2;
            path += ` C${cpx.toFixed(1)},${yPos(prev.v).toFixed(1)} ${cpx.toFixed(1)},${yPos(v).toFixed(1)} ${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`;
          }
        });
        const lastPt = allValsWithIdx[allValsWithIdx.length - 1];
        const firstPt = allValsWithIdx[0];
        const area = path +
          ` L${xPos(lastPt.i).toFixed(1)},${(pad.t + iH).toFixed(1)}` +
          ` L${xPos(firstPt.i).toFixed(1)},${(pad.t + iH).toFixed(1)} Z`;

        return (
          <g key={di} opacity={isGhost ? 0.38 : 1}>
            {!isGhost && <path d={area} fill={`rgba(${rgb},0.07)`} />}
            <path
              d={path} fill="none" stroke={col}
              strokeWidth={isGhost ? '1.5' : '2'}
              strokeDasharray={isGhost ? '5,3' : undefined}
              strokeLinejoin="round"
            />
            {!isGhost && allValsWithIdx.map(({ v, i }) => (
              <circle
                key={i}
                cx={xPos(i).toFixed(1)} cy={yPos(v).toFixed(1)}
                r={hoveredIdx === i ? '4.5' : '3.5'}
                fill={col}
                stroke="#ffffff" strokeWidth="2"
                style={{ transition: 'r 0.1s' }}
              />
            ))}
            {showValueLabels && allValsWithIdx.length > 0 && (() => {
              const points = valueLabelMode === 'all'
                ? allValsWithIdx
                : [allValsWithIdx[allValsWithIdx.length - 1]];
              return points.map(({ v, i }, pi) => {
                const lastPoint = i === n - 1;
                const yShift = valueLabelMode === 'last'
                  ? ((di % 2 === 0) ? -10 : 12)
                  : -8;
                return (
                  <text
                    key={`lbl-${i}-${pi}`}
                    x={xPos(i).toFixed(1)}
                    y={(yPos(v) + yShift).toFixed(1)}
                    textAnchor={lastPoint ? 'end' : 'start'}
                    dx={lastPoint ? '-6' : '6'}
                    fontSize="10"
                    fill={col}
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    paintOrder="stroke"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {valueFmt(v)}
                  </text>
                );
              });
            })()}
          </g>
        );
      })}

      {/* Hit areas — invisible columns for hover detection (on top of datasets) */}
      {labels.map((_, i) => {
        const cx = xPos(i);
        const halfCol = n > 1 ? (iW / (n - 1)) / 2 : iW / 2;
        const rectX = Math.max(pad.l, cx - halfCol);
        const rectW = Math.min(cx + halfCol, pad.l + iW) - rectX;
        return (
          <rect
            key={i}
            x={rectX.toFixed(1)} y={pad.t}
            width={rectW.toFixed(1)} height={iH}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          />
        );
      })}

      {/* Legend — top left */}
      {hasLabels && (() => {
        let curX = pad.l;
        return datasets.map((ds, di) => {
          const col = ds.color || '#4895ef';
          const lbl = ds.label || '';
          const isGhost = ds.ghost === true;
          const x = curX;
          const charW = 7.2;
          curX += lbl.length * charW + 30;
          return (
            <g key={di} opacity={isGhost ? 0.55 : 1}>
              <line
                x1={x} y1={12} x2={x + 14} y2={12}
                stroke={col} strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={isGhost ? '4,2' : undefined}
              />
              {!isGhost && <circle cx={x + 7} cy={12} r="3" fill={col} />}
              <text
                x={x + 19} y={16}
                fontSize="11" fill="#334155"
                fontFamily="Outfit, sans-serif"
                fontWeight={isGhost ? '400' : '600'}
              >
                {lbl}
              </text>
            </g>
          );
        });
      })()}

      {/* Tooltip (rendered last = on top) */}
      {renderTooltip()}
    </svg>
  );
}
