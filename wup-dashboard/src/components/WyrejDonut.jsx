import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

/** Granat / Koral / Złoty / Szary */
const PALETTE = ['#2c3e50', '#c0392b', '#d4af37', '#94a3b8', '#7c8fa8'];

function fmt(n) {
  if (n == null) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#ffffff', border: '1.5px solid #2c3e50',
      borderRadius: '8px', padding: '7px 11px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
    }}>
      <div style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '3px', maxWidth: '180px', lineHeight: 1.3 }}>
        {d.name}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1rem', fontWeight: 800, color: d.color }}>
        {fmt(d.value)}
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginLeft: '5px' }}>
          ({d.pct.toFixed(1).replace('.', ',')}%)
        </span>
      </div>
    </div>
  );
}

/**
 * Donut wypełniający całą kartę (grow).
 * Donut: stała szerokość 180px, skaluje się przez aspect-ratio Recharts.
 * Legenda: reszta szerokości, justify-content: space-evenly.
 */
export default function WyrejDonut({ data = [] }) {
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const chartData = data.map((d, i) => ({
    name:  d.label,
    value: d.value,
    pct:   d.pct != null ? d.pct : (d.value / total * 100),
    color: PALETTE[i % PALETTE.length],
  }));

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', flex: 1, minHeight: 0 }}>

      {/* ── Donut — stała szerokość, aspect=1 → kwadrat ────────────── */}
      <div style={{ flexShrink: 0, width: '175px', position: 'relative', alignSelf: 'center' }}>
        <ResponsiveContainer width="100%" aspect={1}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius="44%" outerRadius="70%"
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Suma w środku */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1.8rem', fontWeight: 700, color: '#1e293b', lineHeight: 1,
          }}>
            {fmt(total)}
          </div>
          <div style={{
            fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            wyrej.
          </div>
        </div>
      </div>

      {/* ── Legenda — równomiernie rozłożona ──────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-evenly', minWidth: 0,
      }}>
        {chartData.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '2px',
              background: d.color, flexShrink: 0, marginTop: '3px',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.75rem', color: '#475569', lineHeight: 1.35,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {d.name}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', lineHeight: 1,
              }}>
                {fmt(d.value)}
              </div>
              <div style={{ fontSize: '0.68rem', color: d.color, fontWeight: 600, marginTop: '1px' }}>
                {d.pct.toFixed(1).replace('.', ',')}%
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
