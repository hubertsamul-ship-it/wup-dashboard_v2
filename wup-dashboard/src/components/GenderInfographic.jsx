import { UserRound } from 'lucide-react';

function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

/**
 * Wielka sylwetka płci — pionowa karta z ikoną size=120,
 * procentem text-6xl (3.75rem) i liczebnikiem.
 */
function GenderStrip({ label, n, total, color }) {
  const pct = total ? (n / total * 100).toFixed(1).replace('.', ',') : '—';
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
      background: '#ffffff',
      borderRadius: '16px',
      padding: '20px 12px 18px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.04)',
      border: `1.5px solid ${color}25`,
    }}>

      {/* Etykieta */}
      <div style={{
        fontSize: '0.65rem', textTransform: 'uppercase',
        letterSpacing: '0.15em', color: '#94a3b8', fontWeight: 700,
      }}>
        {label}
      </div>

      {/* Duża sylwetka */}
      <div style={{
        width: '160px', height: '160px', borderRadius: '50%',
        background: `${color}0e`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${color}20`,
        flexShrink: 0,
      }}>
        <UserRound size={120} color={color} strokeWidth={1.1} />
      </div>

      {/* Procent — dominujący element */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '3.75rem', fontWeight: 900,
        color, lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {pct}<span style={{ fontSize: '2rem', fontWeight: 700 }}>%</span>
      </div>

      {/* Liczba osób */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '1rem', fontWeight: 700, color: '#1e293b',
          lineHeight: 1,
        }}>
          {fmt(n)}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '3px' }}>
          osób
        </div>
      </div>

    </div>
  );
}

export default function GenderInfographic({ kobiety, mezczyzni }) {
  const total = kobiety + mezczyzni;
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginBottom: '12px' }}>
      <GenderStrip label="Kobiety"    n={kobiety}   total={total} color="#e07878" />
      <GenderStrip label="Mężczyźni"  n={mezczyzni} total={total} color="#2563eb" />
    </div>
  );
}
