import { useEffect, useState } from 'react';
import { Briefcase, UserX, UserMinus, MoreHorizontal, History } from 'lucide-react';

function fmt(n) {
  if (n == null) return '—';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

const ICON_MAP = [
  { key: 'kontakt',    Icon: UserX,          color: '#4895ef' },
  { key: 'podjęcie',   Icon: Briefcase,       color: '#52b788' },
  { key: 'pracy',      Icon: Briefcase,       color: '#52b788' },
  { key: 'rezygnacja', Icon: UserMinus,       color: '#e63946' },
  { key: 'wiek',       Icon: History,         color: '#9b8ccc' },
  { key: 'emery',      Icon: History,         color: '#9b8ccc' },
];
function getMeta(label) {
  const l = label.toLowerCase();
  for (const m of ICON_MAP) if (l.includes(m.key)) return m;
  return { Icon: MoreHorizontal, color: '#f4a261' };
}

function AnimatedBar({ targetPct, color }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => requestAnimationFrame(() => setPct(targetPct)), 60);
    return () => clearTimeout(id);
  }, [targetPct]);

  return (
    <div style={{
      height: '8px',
      background: `${color}1a`,
      borderRadius: '99px',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        borderRadius: '99px',
        transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  );
}

export default function WyrejDonut({ data = [] }) {
  if (data.length === 0) return null;

  const maxPct = Math.max(...data.map(d => d.pct ?? 0));

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-evenly', gap: '8px', minHeight: 0,
    }}>
      {data.map((item, i) => {
        const { Icon, color } = getMeta(item.label);
        const pct = item.pct ?? 0;
        const barPct = maxPct ? (pct / maxPct) * 100 : 0;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            {/* Ikona w kółku */}
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={14} color={color} strokeWidth={2} />
            </div>

            {/* Nazwa + pasek */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.7rem', color: '#475569',
                lineHeight: 1.3, marginBottom: '5px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.label}
              </div>
              <AnimatedBar targetPct={barPct} color={color} />
            </div>

            {/* Liczba + procent */}
            <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '68px' }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', lineHeight: 1,
              }}>
                {fmt(item.value)}
              </div>
              <div style={{
                fontSize: '0.62rem', color, fontWeight: 600, marginTop: '2px',
              }}>
                {pct.toFixed(1).replace('.', ',')}%
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
