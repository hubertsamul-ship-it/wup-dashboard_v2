const TITLES = {
  pulpit:       'Przegląd — rynek pracy',
  bezrobotni:   'Osoby bezrobotne — MRPiPS-01',
  stopa:        'Stopa bezrobocia — GUS BDL',
  pracujacy:    'Pracujący — zatrudnienie',
  wynagrodzenia:'Wynagrodzenia — sektor przedsiębiorstw',
  zwolnienia:   'Raporty — zwolnienia grupowe',
  powiaty:      'Analityka powiatowa',
};

export default function TopBar({ page }) {
  return (
    <div style={{
      height: '52px',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
      background: 'var(--bg2)',
    }}>
      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '1.05rem', color: 'var(--text)', letterSpacing: '0.01em',
      }}>
        {TITLES[page] || page}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          fontSize: '0.72rem', color: 'var(--muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Styczeń 2026
        </div>
        <div style={{
          background: 'rgba(22,163,74,0.10)',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: '20px', padding: '3px 10px',
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.05em',
        }}>
          ● LIVE
        </div>
      </div>
    </div>
  );
}
