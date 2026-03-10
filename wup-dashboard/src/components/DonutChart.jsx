const DONUT_COLORS = ['#52b788', '#4895ef', '#f4a261', '#e63946', '#a78bfa'];

function arcPath(cx, cy, R, r, sa, ea) {
  const lg = ea - sa > Math.PI ? 1 : 0;
  const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa);
  const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea);
  const x3 = cx + r * Math.cos(ea), y3 = cy + r * Math.sin(ea);
  const x4 = cx + r * Math.cos(sa), y4 = cy + r * Math.sin(sa);
  return `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R},0,${lg},1,${x2.toFixed(2)},${y2.toFixed(2)} L${x3.toFixed(2)},${y3.toFixed(2)} A${r},${r},0,${lg},0,${x4.toFixed(2)},${y4.toFixed(2)} Z`;
}

export default function DonutChart({ data, colors = DONUT_COLORS, size = 130 }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.44, r = size * 0.28;
  const GAP = 0.03;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let angle = -Math.PI / 2;
  const segments = data.map((d, i) => {
    const span = Math.max((d.value / total) * 2 * Math.PI - GAP, 0);
    const seg = { sa: angle, ea: angle + span, color: colors[i % colors.length], d };
    angle += span + GAP;
    return seg;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: colors[i % colors.length], flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.63rem', color: 'var(--muted)', marginBottom: '1px', lineHeight: 1.3 }}>
                {item.label}{' '}
                <span style={{ color: colors[i % colors.length], fontWeight: 600 }}>
                  ({item.pct != null ? item.pct.toFixed(1).replace('.', ',') : ((item.value / total) * 100).toFixed(1).replace('.', ',')}%)
                </span>
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)',
              }}>
                {item.value.toLocaleString('pl-PL')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Donut SVG */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, R, r, seg.sa, seg.ea)}
            fill={seg.color}
            opacity="0.88"
          />
        ))}
      </svg>
    </div>
  );
}
