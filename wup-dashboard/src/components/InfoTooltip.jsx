import { useState } from 'react';

/**
 * Ikona ⓘ z dymkiem definicji po najechaniu.
 * @param {string} text    — treść dymka (definicja / źródło)
 * @param {string} source  — opcjonalne źródło danych (wyświetlane kursywą)
 */
export default function InfoTooltip({ text, source }) {
  const [show, setShow] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}>
      <span
        style={{
          color: 'var(--muted)',
          fontSize: '0.72rem',
          cursor: 'help',
          opacity: 0.55,
          userSelect: 'none',
          lineHeight: 1,
        }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        ⓘ
      </span>
      {show && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: '#e2e8f0',
          padding: '9px 13px',
          borderRadius: '8px',
          fontSize: '0.68rem',
          lineHeight: 1.55,
          maxWidth: '300px',
          minWidth: '180px',
          zIndex: 200,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          whiteSpace: 'normal',
          pointerEvents: 'none',
        }}>
          {text}
          {source && (
            <div style={{ marginTop: '6px', color: '#94a3b8', fontSize: '0.62rem', fontStyle: 'italic' }}>
              Źródło: {source}
            </div>
          )}
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1e293b',
          }} />
        </div>
      )}
    </span>
  );
}
