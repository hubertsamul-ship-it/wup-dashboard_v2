const COLORS = ['#52b788', '#4895ef', '#f4a261', '#e63946', '#a78bfa'];

function fmt(n) {
  if (n == null) return '—';
  return Math.round(n).toLocaleString('pl-PL');
}

/**
 * Lista przyczyn wyrejestrowania z wbudowanym paskiem proporcjonalnym.
 * Zastępuje DonutChart — pełna szerokość, brak dekoracji SVG.
 *
 * @param {Array} data  — [{ label, value, pct? }] posortowane malejąco
 */
export default function WyrejList({ data = [] }) {
  if (data.length === 0) return null;

  const total  = data.reduce((s, d) => s + d.value, 0) || 1;
  const maxVal = data[0]?.value || 1;

  return (
    <div>
      {data.map((item, i) => {
        const color  = COLORS[i % COLORS.length];
        const pct    = item.pct != null
          ? item.pct.toFixed(1).replace('.', ',')
          : ((item.value / total) * 100).toFixed(1).replace('.', ',');
        const barW   = ((item.value / maxVal) * 100).toFixed(1);

        return (
          <div key={i} style={{ marginBottom: i < data.length - 1 ? '11px' : 0 }}>

            {/* Wiersz nagłówkowy: dot + label + % | liczba */}
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', marginBottom: '4px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: '7px', minWidth: 0, overflow: 'hidden',
              }}>
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '0.68rem', color, fontWeight: 700, flexShrink: 0,
                }}>
                  ({pct}%)
                </span>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)',
                flexShrink: 0, marginLeft: '12px',
              }}>
                {fmt(item.value)}
              </span>
            </div>

            {/* Pasek proporcjonalny */}
            <div style={{
              height: '4px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${barW}%`,
                background: color, borderRadius: '2px',
                opacity: 0.72, transition: 'width 0.8s ease',
              }} />
            </div>

          </div>
        );
      })}
    </div>
  );
}
