import { useState, useEffect } from 'react';
import { Clock, Users, GraduationCap, Briefcase } from 'lucide-react';

const TABS = [
  { id: 'czas', label: 'Czas bezrobocia', color: '#f3a683', Icon: Clock },
  { id: 'wiek', label: 'Wiek',             color: '#4895ef', Icon: Users },
  { id: 'wyk',  label: 'Wykształcenie',    color: '#52b788', Icon: GraduationCap },
  { id: 'staz', label: 'Staż pracy',       color: '#9b8ccc', Icon: Briefcase },
];

/**
 * Słupek z animacją 0% → targetPct%.
 */
function AnimatedBar({ targetPct, color, delay = 0 }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      requestAnimationFrame(() => setPct(targetPct));
    }, delay);
    return () => clearTimeout(id);
  }, [targetPct, delay]);

  return (
    <div style={{
      width: '100%',
      height: `${pct}%`,
      background: `linear-gradient(to top, ${color}99, ${color})`,
      borderRadius: '6px 6px 3px 3px',
      transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    }} />
  );
}

function BarChart({ data, color }) {
  if (!data || data.length === 0) return null;

  const total  = data.reduce((s, d) => s + d.value, 0);
  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Słupki */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-end',
        gap: '5px', minHeight: 0,
      }}>
        {data.map((d, i) => {
          const barPct = maxVal ? Math.max((d.value / maxVal) * 100, 1) : 1;
          const pct    = total  ? (d.value / total * 100).toFixed(1).replace('.', ',') : '0';

          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div style={{
                fontSize: '0.59rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700, color,
                marginBottom: '3px', opacity: 0.95,
                whiteSpace: 'nowrap',
              }}>
                {pct}%
              </div>
              <AnimatedBar targetPct={barPct} color={color} delay={i * 30} />
            </div>
          );
        })}
      </div>

      {/* Etykiety */}
      <div style={{ display: 'flex', gap: '5px', marginTop: '7px', flexShrink: 0 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              fontSize: '0.52rem', color: '#94a3b8',
              textAlign: 'center', lineHeight: 1.3,
              wordBreak: 'break-word', hyphens: 'auto',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsSelector({ czasData, wiekData, wykData, stazData }) {
  const [active, setActive] = useState('czas');

  const datasets   = { czas: czasData, wiek: wiekData, wyk: wykData, staz: stazData };
  const activeTab  = TABS.find(t => t.id === active);
  const currentData = datasets[active] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* ── Taby z ikonami ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '5px 11px', borderRadius: '20px',
                fontSize: '0.64rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : '#64748b',
                background: isActive ? '#1e3a6e' : 'rgba(0,0,0,0.05)',
                border: isActive ? 'none' : '1px solid rgba(0,0,0,0.07)',
                cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.15s',
                letterSpacing: '0.01em', whiteSpace: 'nowrap',
              }}
            >
              <Icon size={11} strokeWidth={2} />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Wykres — key → remount → animacja ──────────────────────── */}
      <div key={active} style={{ flex: 1, minHeight: 0, animation: 'fadeIn 0.2s ease' }}>
        <BarChart data={currentData} color={activeTab?.color ?? '#4895ef'} />
      </div>
    </div>
  );
}
