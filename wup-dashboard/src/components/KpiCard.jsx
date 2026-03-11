import { useEffect, useRef, useState } from 'react';

function useCountUp(target, decimals = 0, duration = 1200) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let startTs = null;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(target * ease);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  if (decimals > 0) return (val / Math.pow(10, decimals)).toFixed(1).replace('.', ',');
  // Liczba całkowita: separator tysięcy twardą spacją (niezawodne cross-browser)
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

const ACCENT_MAP = {
  blue:  { after: 'rgba(37,99,235,0.05)' },
  red:   { after: 'rgba(192,57,43,0.06)' },
  green: { after: 'rgba(22,163,74,0.06)' },
  orange:{ after: 'rgba(224,123,32,0.06)' },
};

const FLAG_COLORS = {
  pl:    'var(--blue)',
  maz:   'var(--accent)',
  waw:   'var(--accent2)',
  green: 'var(--green)',
};

export default function KpiCard({
  flag, flagColor = 'pl',
  target, decimals = 0, suffix = '',
  label, delta, deltaType = 'up',
  variant,   // 'red' | 'green' | 'blue' | undefined
  compact,   // smaller padding + font for dense layouts
  style: extraStyle = {},
}) {
  const displayed = useCountUp(target, decimals);
  const accentRgba = ACCENT_MAP[variant]?.after || ACCENT_MAP.blue.after;

  const pad     = compact ? '12px 14px' : '26px 28px';
  const numSize = compact ? '1.8rem'    : '3.1rem';
  const sufSize = compact ? '0.85rem'   : '1.0rem';
  const flagMb  = compact ? '6px'       : '10px';
  const labelMt = compact ? '5px'       : '8px';
  const deltaMt = compact ? '7px'       : '10px';

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-br)',
      borderRadius: '16px', padding: pad,
      boxShadow: 'var(--card-shadow)',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      cursor: 'default',
      ...extraStyle,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-br)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* glow orb */}
      <div style={{
        position: 'absolute', bottom: '-30px', right: '-30px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: `radial-gradient(circle, ${accentRgba}, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* flag — region label */}
      <div style={{
        fontSize: 'var(--font-xs)', fontWeight: 700, letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: FLAG_COLORS[flagColor] || 'var(--muted)',
        marginBottom: flagMb,
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
        {flag}
      </div>

      {/* number */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: numSize, fontWeight: 800, color: 'var(--text)',
        lineHeight: 1, letterSpacing: '-0.03em',
      }}>
        {displayed}
        {suffix && <span style={{ fontSize: sufSize, color: 'var(--muted)', fontWeight: 500, marginLeft: '5px' }}>{suffix}</span>}
      </div>

      {/* label — analytic caption */}
      <div style={{
        fontSize: 'var(--font-xs)', color: 'var(--muted)',
        marginTop: labelMt, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.07em',
        lineHeight: 1.4,
      }}>
        {label}
      </div>

      {/* delta */}
      {delta && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          marginTop: deltaMt, padding: '4px 11px', borderRadius: '999px',
          fontSize: 'var(--font-xs)', fontWeight: 600,
          fontFamily: "'JetBrains Mono', monospace",
          ...(deltaType === 'up'
            ? { background: 'rgba(192,57,43,0.08)', color: '#b03020', border: '1px solid rgba(192,57,43,0.15)' }
            : deltaType === 'dn'
              ? { background: 'rgba(22,163,74,0.08)', color: '#15803d', border: '1px solid rgba(22,163,74,0.18)' }
              : { background: 'rgba(0,0,0,0.04)', color: 'var(--muted)', border: '1px solid var(--border)' }
          ),
        }}>
          {delta}
        </div>
      )}
    </div>
  );
}
