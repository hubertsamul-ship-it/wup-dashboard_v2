import { useState } from 'react';

function fmtSaldo(n) {
  const abs = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return n >= 0 ? `+${abs}` : `\u2212${abs}`;
}
function fmtN(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

/**
 * Combo: słupki saldo (wyrej−zarej) + linie zarej/wyrej na osobnej skali.
 */
export default function SaldoBarChart({ zarej = [], wyrej = [], labels = [], height = 155 }) {
  const [tipIdx, setTipIdx] = useState(null);

  const n = zarej.length;
  if (n === 0) return null;

  const saldo   = zarej.map((z, i) => (wyrej[i] ?? 0) - (z ?? 0));
  const maxAbs  = Math.max(...saldo.map(Math.abs), 1);
  const maxLine = Math.max(...zarej.filter(v => v != null), ...wyrej.filter(v => v != null), 1);

  const W        = 520;
  const TOP_PAD  = 12;
  const BOT_PAD  = 22;
  const CHART_H  = height - BOT_PAD;
  const ZERO_Y   = TOP_PAD + (CHART_H - TOP_PAD) / 2;
  const MAX_BAR  = (CHART_H - TOP_PAD) / 2 - 2;

  const BAR_SLOT   = W / n;
  const BAR_W      = Math.max(BAR_SLOT * 0.68, 6);
  const BAR_OFFSET = (BAR_SLOT - BAR_W) / 2;

  // Skala liniowa: 0 → CHART_H, maxLine → TOP_PAD
  const lineY = (val) => TOP_PAD + (1 - (val ?? 0) / maxLine) * (CHART_H - TOP_PAD);
  const lineX = (i)   => i * BAR_SLOT + BAR_SLOT / 2;

  const zarejPts = zarej.map((v, i) => `${lineX(i)},${lineY(v ?? 0)}`).join(' ');
  const wyrejPts = wyrej.map((v, i) => `${lineX(i)},${lineY(v ?? 0)}`).join(' ');

  const lastSaldo = saldo[n - 1];
  const curZarej  = zarej[n - 1] ?? 0;
  const curWyrej  = wyrej[n - 1] ?? 0;

  return (
    <div>
      {/* Ministatystyki bieżącego miesiąca */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '0.67rem', color: 'var(--muted)' }}>
        <span>
          <span style={{ color: 'var(--muted2)' }}>Zarej.: </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#e63946' }}>{fmtN(curZarej)}</span>
        </span>
        <span>
          <span style={{ color: 'var(--muted2)' }}>Wyrej.: </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#4895ef' }}>{fmtN(curWyrej)}</span>
        </span>
        <span>
          <span style={{ color: 'var(--muted2)' }}>Saldo: </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: lastSaldo >= 0 ? '#52b788' : '#e63946' }}>
            {fmtSaldo(lastSaldo)} os.
          </span>
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ overflow: 'visible', display: 'block' }}>

          {/* Linia zero */}
          <line x1={0} y1={ZERO_Y} x2={W} y2={ZERO_Y} stroke="rgba(255,255,255,0.14)" strokeWidth={1} strokeDasharray="3 3" />

          {/* Słupki saldo */}
          {saldo.map((val, i) => {
            const barH  = Math.max((Math.abs(val) / maxAbs) * MAX_BAR, 2);
            const isPos = val >= 0;
            const color = isPos ? '#52b788' : '#e63946';
            const x     = i * BAR_SLOT + BAR_OFFSET;
            const y     = isPos ? ZERO_Y - barH : ZERO_Y;
            const showLbl = true;
            const lbl   = (labels[i] || '').slice(0, 6);
            return (
              <g key={i}>
                <rect
                  x={x} y={y} width={BAR_W} height={barH}
                  rx={2} fill={color} opacity={tipIdx === i ? 0.9 : 0.45}
                  style={{ cursor: 'default', transition: 'opacity 0.15s' }}
                  onMouseEnter={() => setTipIdx(i)}
                  onMouseLeave={() => setTipIdx(null)}
                />
                {showLbl && (
                  <text x={x + BAR_W / 2} y={CHART_H + 15} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9.5} fontFamily="Outfit, sans-serif">
                    {lbl}
                  </text>
                )}
              </g>
            );
          })}

          {/* Linie zarej / wyrej */}
          <polyline points={zarejPts} fill="none" stroke="#e63946" strokeWidth={2} strokeOpacity={0.8} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={wyrejPts} fill="none" stroke="#4895ef" strokeWidth={2} strokeOpacity={0.8} strokeLinejoin="round" strokeLinecap="round" />

          {/* Punkty */}
          {zarej.map((v, i) => (
            <circle key={`z${i}`} cx={lineX(i)} cy={lineY(v ?? 0)} r={2.8} fill="#e63946" opacity={0.9}
              onMouseEnter={() => setTipIdx(i)} onMouseLeave={() => setTipIdx(null)} style={{ cursor: 'default' }} />
          ))}
          {wyrej.map((v, i) => (
            <circle key={`w${i}`} cx={lineX(i)} cy={lineY(v ?? 0)} r={2.8} fill="#4895ef" opacity={0.9}
              onMouseEnter={() => setTipIdx(i)} onMouseLeave={() => setTipIdx(null)} style={{ cursor: 'default' }} />
          ))}

          {/* Tooltip */}
          {tipIdx !== null && (() => {
            const val   = saldo[tipIdx];
            const color = val >= 0 ? '#52b788' : '#e63946';
            const x     = tipIdx * BAR_SLOT + BAR_SLOT / 2;
            const TW = 148;
            const TX = Math.min(Math.max(x - TW / 2, 2), W - TW - 2);
            const TY = TOP_PAD + 2;
            return (
              <g>
                <rect x={TX} y={TY} width={TW} height={38} rx={4} fill="#1a2233" stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
                <text x={TX + TW / 2} y={TY + 13} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="Outfit, sans-serif">{labels[tipIdx] ?? ''}</text>
                <text x={TX + TW / 2} y={TY + 25} textAnchor="middle" fill={color} fontSize={8.5} fontFamily="'JetBrains Mono', monospace" fontWeight={700}>
                  {`saldo ${fmtSaldo(val)}  Z:${fmtN(zarej[tipIdx] ?? 0)}  W:${fmtN(wyrej[tipIdx] ?? 0)}`}
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { color: '#e63946', type: 'line', label: 'Zarejestrowani' },
            { color: '#4895ef', type: 'line', label: 'Wyrejestrowani' },
            { color: '#52b788', type: 'bar',  label: 'Saldo +' },
            { color: '#e63946', type: 'bar',  label: 'Saldo −' },
          ].map(({ color, type, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {type === 'line'
                ? <div style={{ width: '14px', height: '2px', background: color, borderRadius: '1px', opacity: 0.8 }} />
                : <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: color, opacity: 0.65 }} />
              }
              <span style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
