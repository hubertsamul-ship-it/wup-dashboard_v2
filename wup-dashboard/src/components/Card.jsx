import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

/**
 * grow=true → card uczestniczy w flex layout parenta:
 *   wewnątrz ustawia flex-column, content scrolluje jeśli nie mieści się
 * exportTitle — gdy podany, pojawia się przycisk pobierania PNG
 */
export default function Card({ title, badge, badgeLive, children, style: extraStyle = {}, grow = false, exportTitle }) {
  const contentRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current || exporting) return;
    setExporting(true);
    const btn = contentRef.current.querySelector('[data-export-btn]');
    if (btn) btn.style.visibility = 'hidden';
    try {
      const bg = window.getComputedStyle(contentRef.current).backgroundColor;
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, useCORS: true,
        backgroundColor: bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${exportTitle || title || 'wykres'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Eksport PNG:', e);
    } finally {
      if (contentRef.current) {
        const b = contentRef.current.querySelector('[data-export-btn]');
        if (b) b.style.visibility = 'visible';
      }
      setExporting(false);
    }
  };

  return (
    <div
      ref={contentRef}
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-br)',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: 'var(--card-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        ...(grow ? { display: 'flex', flexDirection: 'column' } : {}),
        ...extraStyle,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--card-br)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
    >
      {(title || badge || exportTitle) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '10px', flexShrink: 0,
        }}>
          {title && (
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text)', letterSpacing: '0.01em' }}>
              {title}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {badge && (
              <div style={{
                fontSize: 'var(--font-xs)',
                background: badgeLive ? '#E0E7FF' : 'rgba(0,0,0,0.05)',
                color: badgeLive ? '#3730A3' : 'var(--muted)',
                border: badgeLive ? '1px solid #C7D2FE' : '1px solid rgba(0,0,0,0.07)',
                padding: '2px 8px', borderRadius: '20px', fontWeight: 500,
              }}>
                {badge}
              </div>
            )}
            {exportTitle && (
              <button
                data-export-btn
                onClick={handleExport}
                title="Pobierz jako PNG"
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.10)',
                  background: 'rgba(0,0,0,0.04)', color: 'var(--muted)',
                  cursor: exporting ? 'wait' : 'pointer',
                  fontSize: '0.65rem', fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                  transition: 'all 0.15s',
                  opacity: exporting ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                <DownloadIcon />
                {exporting ? '…' : 'PNG'}
              </button>
            )}
          </div>
        </div>
      )}
      {children}
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
      marginBottom: '8px',
      ...(grow ? { alignItems: 'stretch' } : {}),
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
