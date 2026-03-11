/**
 * grow=true → card uczestniczy w flex layout parenta:
 *   wewnątrz ustawia flex-column, content scrolluje jeśli nie mieści się
 */
export default function Card({ title, badge, badgeLive, children, style: extraStyle = {}, grow = false }) {
  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-br)',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: 'var(--card-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...(grow ? { display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' } : {}),
        ...extraStyle,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-br)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
    >
      {(title || badge) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '10px', flexShrink: 0,
        }}>
          {title && (
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.01em' }}>
              {title}
            </div>
          )}
          {badge && (
            <div style={{
              fontSize: 'var(--font-xs)',
              background: badgeLive ? 'rgba(22,163,74,0.10)' : 'rgba(0,0,0,0.05)',
              color: badgeLive ? 'var(--green)' : 'var(--muted)',
              border: badgeLive ? '1px solid rgba(22,163,74,0.25)' : '1px solid rgba(0,0,0,0.07)',
              padding: '2px 8px', borderRadius: '20px', fontWeight: 500,
            }}>
              {badge}
            </div>
          )}
        </div>
      )}
      {grow
        ? <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>{children}</div>
        : children
      }
    </div>
  );
}

export function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: '10px', flexShrink: 0 }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'var(--font-xl)', color: 'var(--text)', letterSpacing: '-0.01em' }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 'var(--font-sm)', color: 'var(--muted)', marginTop: '3px', lineHeight: 1.5 }}>{sub}</div>}
      <div style={{ width: '32px', height: '2px', background: 'var(--accent)', marginTop: '5px', borderRadius: '1px' }} />
    </div>
  );
}

/**
 * grow=true → Grid uczestniczy w flex layout strony: flex:1, minHeight:0
 *             Karty wewnątrz dostają align-items: stretch → wypełniają wysokość
 */
export function Grid({ cols = 2, children, style: extraStyle = {}, grow = false }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '8px',
      marginBottom: grow ? 0 : '8px',
      ...(grow ? { flex: 1, minHeight: 0, alignItems: 'stretch' } : {}),
      ...extraStyle,
    }}>
      {children}
    </div>
  );
}

export function Toggle({ options, active, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg3)',
      borderRadius: '8px', padding: '3px', gap: '2px',
      border: '1px solid var(--border)',
    }}>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            padding: '4px 12px', borderRadius: '6px',
            fontSize: '0.7rem', fontWeight: active === opt.id ? 600 : 500,
            color: active === opt.id ? '#fff' : 'var(--muted)',
            cursor: 'pointer', border: 'none',
            background: active === opt.id ? 'var(--nav-active)' : 'transparent',
            fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
