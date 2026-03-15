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

export default function WyrejDonut({ data = [] }) {
  if (data.length === 0) return null;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'space-evenly', gap: '10px', minHeight: 0,
    }}>
      {data.map((item, i) => {
        const { Icon, color } = getMeta(item.label);
        const pct = item.pct ?? 0;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

            {/* Ikona */}
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={13} color={color} strokeWidth={2} />
            </div>

            {/* Linia: Nazwa ............ % liczba */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'baseline', gap: '6px', minWidth: 0,
            }}>
              {/* Nazwa */}
              <span style={{
                fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {item.label}
              </span>

              {/* Linia kropkowana */}
              <div style={{
                flex: 1,
                borderBottom: '1px dotted rgba(148,163,184,0.35)',
                marginBottom: '3px',
              }} />

              {/* Procent */}
              <span style={{
                fontSize: '0.78rem', color, fontWeight: 700,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {pct.toFixed(1).replace('.', ',')}%
              </span>

              {/* Liczba */}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0',
                whiteSpace: 'nowrap', flexShrink: 0, minWidth: '52px', textAlign: 'right',
              }}>
                {fmt(item.value)}
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
}
