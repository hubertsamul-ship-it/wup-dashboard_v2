import { useAppData } from '../context/DataContext';

const TITLES = {
  pulpit:       'Przegląd — rynek pracy',
  bezrobotni:   'Osoby bezrobotne — MRPiPS-01',
  stopa:        'Stopa bezrobocia — GUS BDL',
  pracujacy:    'Pracujący — zatrudnienie',
  wynagrodzenia:'Wynagrodzenia — sektor przedsiębiorstw',
  zwolnienia:   'Zwolnienia grupowe',
  powiaty:      'Analityka powiatowa',
};

const MONTHS_FULL = [
  'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
  'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
];

function formatOkres(s) {
  if (!s) return '';
  const [y, m] = s.split('-').map(Number);
  return `${MONTHS_FULL[m - 1]} ${y}`;
}

function getPagePeriod(page, meta) {
  if (!meta) return '';
  if (page === 'stopa') return formatOkres(meta.stopa_okres);
  if (page === 'pracujacy' || page === 'wynagrodzenia') return 'I półrocze 2025';
  return formatOkres(meta.okres);
}

export default function TopBar({ page }) {
  const { meta } = useAppData();
  const period = getPagePeriod(page, meta);

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
        fontSize: 'var(--font-lg)', color: 'var(--text)', letterSpacing: '0.01em',
      }}>
        {TITLES[page] || page}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          fontSize: 'var(--font-xs)', color: 'var(--muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {period}
        </div>
        <div style={{
          background: 'rgba(22,163,74,0.10)',
          border: '1px solid rgba(22,163,74,0.25)',
          borderRadius: '20px', padding: '3px 10px',
          fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--green)', letterSpacing: '0.05em',
        }}>
          ● LIVE
        </div>
      </div>
    </div>
  );
}
