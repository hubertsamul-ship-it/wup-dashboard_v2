// Horizontal bar chart matching mockup aesthetic

// Formatowanie wartości: liczby całkowite z separatorem tysięcy,
// ułamkowe (stopa %) zawsze z 1 miejscem po przecinku i polskim przecinkiem
function fmtBarVal(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v))
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const [int, dec] = v.toFixed(1).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ',' + dec;
}

function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + t * (b[i] - v)));
}

export function stopaColor(val, mx) {
  const t = val / mx;
  return `rgb(${lerp([191,219,254],[230,57,70],t).join(',')})`;
}

export function blueColor(val, mx) {
  const t = val / mx;
  return `rgb(${lerp([191,219,254],[30,58,95],t).join(',')})`;
}

export function greenColor(val, mx) {
  const t = val / mx;
  return `rgb(${lerp([187,247,208],[21,128,61],t).join(',')})`;
}

/**
 * @param {Array}    data       — [{ label, value, pct? }]  (pct: opcjonalny udział %)
 * @param {string}   unit       — np. ' os.' lub '%'
 * @param {Function} colorFn    — blueColor | greenColor | stopaColor
 * @param {number}   maxItems   — max elementów (undefined = wszystkie)
 * @param {number}   barHeight  — wysokość słupka w px (domyślnie 6)
 * @param {boolean}  wrapLabel  — zezwól na zawijanie etykiety (domyślnie false = ellipsis)
 * @param {number}   labelWidth — szerokość kolumny etykiety w px (domyślnie 140)
 */
export default function HorizontalBar({
  data,
  unit = '',
  colorFn = blueColor,
  maxItems,
  barHeight = 6,
  wrapLabel = false,
  labelWidth = 140,
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const items  = maxItems ? sorted.slice(0, maxItems) : sorted;
  const maxVal = Math.max(...items.map(d => d.value));

  return (
    <div>
      {items.map((d, i) => {
        const pct = (d.value / maxVal * 100).toFixed(1);
        const col = colorFn(d.value, maxVal);
        const dispVal = unit === '%'
          ? d.value.toFixed(1).replace('.', ',')
          : fmtBarVal(d.value);
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: wrapLabel ? 'flex-start' : 'center',
              gap: '10px',
              marginBottom: '7px',
            }}
          >
            {/* Label */}
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--muted)',
                width: `${labelWidth}px`,
                flexShrink: 0,
                ...(wrapLabel
                  ? { whiteSpace: 'normal', lineHeight: 1.35, paddingTop: '2px' }
                  : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                ),
              }}
              title={wrapLabel ? undefined : d.label}
            >
              {d.label}
            </div>

            {/* Bar + value column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '3px' }}>
              <div style={{ height: `${barHeight}px`, background: 'rgba(0,0,0,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '3px', background: col, width: `${pct}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>

            {/* Value */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)',
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0,
              ...(wrapLabel ? { paddingTop: '2px' } : {}),
            }}>
              {dispVal}{unit}
              {d.pct != null && (
                <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: '4px', fontSize: '0.65rem' }}>
                  {d.pct.toFixed(1).replace('.', ',')}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
