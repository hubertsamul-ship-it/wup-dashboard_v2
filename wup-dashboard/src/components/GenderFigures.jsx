// Wspólne sylwetki SVG i kafelek Płeć — używane na Bezrobotni i Powiaty

function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

export function FemaleSvg({ color, size = 64 }) {
  const h = Math.round(size * 130 / 60);
  return (
    <svg viewBox="0 0 60 130" width={size} height={h} fill={color} style={{ display: 'block' }}>
      <ellipse cx="30" cy="8"  rx="10" ry="7" />
      <ellipse cx="30" cy="20" rx="12" ry="13" />
      <rect x="26.5" y="32" width="7" height="6" rx="2" />
      <path d="M 17,38 C 12,44 13,52 15,56 L 45,56 C 47,52 48,44 43,38 C 38,33 22,33 17,38 Z" />
      <path d="M 15,56 C 8,71 4,104 3,123 L 57,123 C 56,104 52,71 45,56 Z" />
      <path d="M 17,42 C 11,54 9,65 10,74" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <path d="M 43,42 C 49,54 51,65 50,74" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

export function MaleSvg({ color, size = 58 }) {
  const h = Math.round(size * 130 / 60);
  return (
    <svg viewBox="0 0 60 130" width={size} height={h} fill={color} style={{ display: 'block' }}>
      <ellipse cx="30" cy="14" rx="13" ry="13" />
      <rect x="26.5" y="26" width="7" height="6" rx="2" />
      <path d="M 9,32 C 7,42 8,57 9,65 L 51,65 C 52,57 53,42 51,32 C 44,27 16,27 9,32 Z" />
      <path d="M 9,65 L 10,123 L 28,123 L 30,65 Z" />
      <path d="M 30,65 L 32,123 L 50,123 L 51,65 Z" />
      <path d="M 9,36 C 4,51 3,65 4,77"  fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
      <path d="M 51,36 C 56,51 57,65 56,77" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export default function GenderFigure({ label, n, total, color, isFemale }) {
  const pct    = total ? (n / total * 100) : 0;
  const pctStr = pct.toFixed(1).replace('.', ',');

  return (
    <div style={{
      flex: 1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '8px', padding: '6px 2px',
    }}>
      <div style={{
        fontSize: '0.6rem', textTransform: 'uppercase',
        letterSpacing: '0.12em', fontWeight: 800,
        color: `${color}bb`, lineHeight: 1,
      }}>
        {label}
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        {isFemale ? <FemaleSvg color={color} size={56} /> : <MaleSvg color={color} size={52} />}
        <div style={{
          position: 'absolute', left: '50%', top: '42%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.94)', borderRadius: '8px',
          padding: '2px 5px', fontSize: '0.63rem', fontWeight: 800,
          color, lineHeight: 1.2,
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          border: `1.5px solid ${color}30`, whiteSpace: 'nowrap',
        }}>
          {pctStr}%
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1.1rem', fontWeight: 900, color, lineHeight: 1,
        }}>
          {fmt(n)}
        </div>
        <div style={{
          fontSize: '0.47rem', fontWeight: 600, color: '#94a3b8',
          letterSpacing: '0.08em', marginTop: '3px',
        }}>
          OSÓB
        </div>
      </div>
    </div>
  );
}
