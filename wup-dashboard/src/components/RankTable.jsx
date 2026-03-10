// Pomocnicze formatowanie wartości
function fmtVal(v, unit) {
  if (unit === '%') return v.toFixed(1).replace('.', ',') + '%';
  if (Number.isInteger(v))
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + unit;
  const [int, dec] = v.toFixed(1).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ',' + dec + unit;
}

/**
 * Numerowana tabela rankingowa z subtelnym paskiem proporcjonalnym w tle.
 *
 * @param {Array}    data        — [{ label, value }] — NIE musi być posortowane
 * @param {string}   unit        — ' os.' | ' zł' | '%' | ''
 * @param {string}   accentColor — kolor ranku i paska (#52b788, #e63946, #4895ef …)
 * @param {boolean}  reverse     — true = niższe wartości wyżej (BOT listy)
 */
export default function RankTable({ data = [], unit = '', accentColor = '#4895ef', reverse = false }) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => reverse ? a.value - b.value : b.value - a.value);
  const maxVal = Math.max(...sorted.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {sorted.map((item, i) => {
        const fillPct = (item.value / maxVal * 100).toFixed(1);
        const isEven  = i % 2 === 0;

        return (
          <div
            key={i}
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '22px 1fr auto',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '5px',
              background: isEven ? 'rgba(255,255,255,0.018)' : 'transparent',
              overflow: 'hidden',
              cursor: 'default',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = isEven ? 'rgba(255,255,255,0.018)' : 'transparent'; }}
          >
            {/* Pasek proporcjonalny w tle */}
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: `${fillPct}%`,
              background: accentColor,
              opacity: 0.07,
              pointerEvents: 'none',
              transition: 'width 0.9s ease',
            }} />

            {/* Numer pozycji */}
            <span style={{
              fontSize: '0.62rem',
              fontFamily: "'JetBrains Mono', monospace",
              color: accentColor,
              fontWeight: 700,
              textAlign: 'right',
              opacity: 0.85,
              zIndex: 1,
              flexShrink: 0,
            }}>
              #{i + 1}
            </span>

            {/* Nazwa — pełna, może się zawijać */}
            <span style={{
              fontSize: '0.71rem',
              color: 'var(--muted2)',
              lineHeight: 1.35,
              zIndex: 1,
              wordBreak: 'break-word',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: accentColor, flexShrink: 0,
                marginTop: '4px', display: 'inline-block',
                opacity: 0.75,
              }} />
              {item.label}
            </span>

            {/* Wartość */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.74rem',
              fontWeight: 700,
              color: 'var(--text)',
              whiteSpace: 'nowrap',
              textAlign: 'right',
              zIndex: 1,
              flexShrink: 0,
            }}>
              {fmtVal(item.value, unit)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
