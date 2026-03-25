import { useState, useRef, useEffect } from 'react';

/**
 * CustomSelect — dropdown z wyglądem PowiatDropdown (ciemne tło, brak natywnego <select>)
 *
 * Props:
 *   value      — aktualnie wybrana wartość (string)
 *   onChange   — fn(value)
 *   options    — string[] lub {value, label}[]
 *   placeholder — tekst gdy brak wyboru
 *   minWidth   — minimalna szerokość triggera (px, domyślnie 90)
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = '—', minWidth = 90 }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Normalizuj opcje do {value, label}
  const items = options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
  const selected = items.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', minWidth, display: 'inline-block' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '5px 26px 5px 10px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--border)', borderRadius: '8px',
          color: 'var(--text)', fontFamily: 'Outfit, sans-serif', fontSize: '0.78rem',
          cursor: 'pointer', textAlign: 'left', position: 'relative',
          whiteSpace: 'nowrap',
        }}
      >
        {selected?.label ?? placeholder}
        <span style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
          fontSize: '0.60rem', color: 'var(--muted)', pointerEvents: 'none',
        }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%',
            background: '#0f172a', border: '1px solid var(--border)',
            borderRadius: '10px', zIndex: 99,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            maxHeight: '220px', overflowY: 'auto',
          }}>
            {items.map(o => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: o.value === value ? 'rgba(255,255,255,0.10)' : 'none',
                  border: 'none', color: o.value === value ? '#fff' : '#cbd5e1',
                  padding: '7px 14px', fontSize: '0.78rem',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (o.value !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (o.value !== value) e.currentTarget.style.background = 'none'; }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * RangeSelector — selektor zakresu Od/Do oparty na CustomSelect
 */
export function RangeSelector({ labels, from, to, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>Od:</span>
      <CustomSelect value={from} onChange={v => onChange(v, to)} options={labels} minWidth={90} />
      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--muted)' }}>Do:</span>
      <CustomSelect value={to} onChange={v => onChange(from, v)} options={labels} minWidth={90} />
    </div>
  );
}
