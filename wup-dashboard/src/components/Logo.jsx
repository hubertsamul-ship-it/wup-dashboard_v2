// Inline SVG logo — gwarantuje czcionkę Outfit + skaluje się bez artefaktów

export function LogoIcon({ size = 36 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size} height={size}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="li" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5bb5ff" />
          <stop offset="100%" stopColor="#22c4b0" />
        </linearGradient>
      </defs>
      {/* Tło */}
      <rect width="64" height="64" rx="14" fill="#0d1e42" />
      {/* 5 słupków M (baseline y=57) */}
      <rect x="8.5"  y="19" width="7" height="38" rx="2" fill="url(#li)" />
      <rect x="18.5" y="33" width="7" height="24" rx="2" fill="url(#li)" />
      <rect x="28.5" y="44" width="7" height="13" rx="2" fill="url(#li)" opacity="0.65" />
      <rect x="38.5" y="33" width="7" height="24" rx="2" fill="url(#li)" />
      <rect x="48.5" y="14" width="7" height="43" rx="2" fill="url(#li)" />
      {/* Czerwony aksent trendu */}
      <circle cx="52" cy="9" r="4.5" fill="#e63946" />
    </svg>
  );
}

export function LogoFull({ width = 220 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width }}>
      <LogoIcon size={44} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '1.25rem',
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: '#f1f5f9',
          lineHeight: 1.1,
        }}>
          MAZOSTAT
        </span>
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '0.58rem',
          fontWeight: 500,
          letterSpacing: '0.22em',
          color: '#4895ef',
          lineHeight: 1,
          marginTop: '2px',
        }}>
          MAZOWSZE · RYNEK PRACY
        </span>
      </div>
    </div>
  );
}
