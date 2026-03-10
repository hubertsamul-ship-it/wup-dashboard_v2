function fmt(n) {
  if (n == null) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

/**
 * Jedna mini-karta dla jednej grupy charakterystyki.
 * #1 pozycja: duży font + kolor akcentu.
 * #2–3: małe wiersze z %, brak pasków.
 */
function CharMiniCard({ label, data = [], accentColor = '#4895ef' }) {
  const total  = data.reduce((s, d) => s + d.value, 0) || 1;
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 3);
  if (sorted.length === 0) return null;

  const [first, ...rest] = sorted;
  const firstPct = (first.value / total * 100).toFixed(1).replace('.', ',');

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '11px 13px',
      borderLeft: `2px solid ${accentColor}55`,
    }}>
      {/* Nagłówek grupy */}
      <div style={{
        fontSize: '0.58rem', textTransform: 'uppercase',
        letterSpacing: '0.07em', color: 'var(--muted)',
        marginBottom: '7px',
      }}>
        {label}
      </div>

      {/* Pozycja dominująca */}
      <div style={{ marginBottom: '7px' }}>
        <div style={{
          fontSize: '0.67rem', color: 'var(--muted2)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: '2px',
        }}>
          {first.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)',
          }}>
            {fmt(first.value)}
          </span>
          <span style={{ fontSize: '0.65rem', color: accentColor, fontWeight: 600 }}>
            {firstPct}%
          </span>
        </div>
      </div>

      {/* Pozycje 2–3 */}
      {rest.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '6px',
          display: 'flex', flexDirection: 'column', gap: '3px',
        }}>
          {rest.map((item, i) => {
            const pct = (item.value / total * 100).toFixed(1).replace('.', ',');
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '0.62rem', color: 'var(--muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', maxWidth: '68%',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '0.62rem', color: 'var(--muted2)',
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Siatka 2×2 mini-kart charakterystyki bezrobotnych.
 */
export default function CharMiniCards({ czasData = [], wiekData = [], wykData = [], stazData = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {czasData.length > 0 && (
        <CharMiniCard label="Czas pozostawania bez pracy" data={czasData} accentColor="#4895ef" />
      )}
      {wiekData.length > 0 && (
        <CharMiniCard label="Wiek" data={wiekData} accentColor="#52b788" />
      )}
      {wykData.length > 0 && (
        <CharMiniCard label="Wykształcenie" data={wykData} accentColor="#4895ef" />
      )}
      {stazData.length > 0 && (
        <CharMiniCard label="Staż pracy ogółem" data={stazData} accentColor="#52b788" />
      )}
    </div>
  );
}
