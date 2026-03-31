/**
 * OracleHero — sekcja "The Oracle" z głównymi KPI
 * Decyzja w 5 sekund: najważniejsze metryki + trend + status + insight AI
 * 
 * Dla instytucji publicznych: czytelność, eksportowalność, profesjonalizm
 */
import { useState, useEffect, useRef } from 'react';

// Animacja countUp
function useCountUp(target, decimals = 0, duration = 1000) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let startTs = null;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(target * ease);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  if (decimals > 0) return (val / Math.pow(10, decimals)).toFixed(1).replace('.', ',');
  return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

// Status badge na podstawie zmian
function getStatusBadge(deltaMoM, deltaYoY, threshold = 0.2) {
  if (deltaMoM > 0.5 || deltaYoY > 1) {
    return { label: 'Pogorszenie', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.20)' };
  }
  if (deltaMoM > threshold) {
    return { label: 'Wzrostowy', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.20)' };
  }
  if (deltaMoM < -threshold) {
    return { label: 'Poprawa', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.20)' };
  }
  return { label: 'Stabilny', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.20)' };
}

// Mini sparkline SVG
function Sparkline({ data, color = '#2563eb', width = 100, height = 32 }) {
  if (!data || data.length < 2) return null;
  
  const validData = data.filter(v => v != null);
  if (validData.length < 2) return null;
  
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1;
  const pad = 4;
  const iW = width - pad * 2;
  const iH = height - pad * 2;
  
  const points = validData.map((v, i) => {
    const x = pad + (i / (validData.length - 1)) * iW;
    const y = pad + iH - ((v - min) / range) * iH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const lastPoint = validData[validData.length - 1];
  const lastX = pad + iW;
  const lastY = pad + iH - ((lastPoint - min) / range) * iH;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="3"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n).toFixed(1).replace('.', ',');
  return n >= 0 ? `+${abs}` : `−${abs}`;
}

function fmtInt(n) {
  if (n == null) return '—';
  const abs = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return n >= 0 ? `+${abs}` : `−${abs}`;
}

export default function OracleHero({
  stopa,            // aktualna stopa bezrobocia (np. 5.2)
  stopaLabel = 'Stopa bezrobocia',
  bezrobotni,       // liczba bezrobotnych
  deltaMoM,         // zmiana m/m w pp
  deltaYoY,         // zmiana r/r w pp
  bezrDeltaMoM,     // zmiana m/m liczby bezrobotnych
  bezrDeltaYoY,     // zmiana r/r liczby bezrobotnych
  napływMoM,        // napływ m/m
  odpływMoM,        // odpływ m/m
  pozycjaWoj,       // pozycja w województwie (np. "8/37")
  percentyl,        // percentyl (np. 78)
  trend12m = [],    // dane sparkline 12m dla stopy
  trendNapOdp = [], // [{ naplyw, odplyw }] 12m
  insight,          // tekst insight AI
  okres = '',       // np. "Grudzień 2024"
  region = 'Mazowieckie',
}) {
  const displayedStopa = useCountUp(Math.round((stopa ?? 0) * 10), 1);
  const displayedBezr = useCountUp(bezrobotni ?? 0, 0);
  
  const status = getStatusBadge(deltaMoM ?? 0, deltaYoY ?? 0);
  const ratio = napływMoM && odpływMoM ? (napływMoM / Math.abs(odpływMoM)).toFixed(2) : null;
  const ratioAlert = ratio && parseFloat(ratio) > 1.2;

  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-br)',
      borderRadius: '16px',
      padding: '20px 24px',
      boxShadow: 'var(--card-shadow)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Dekoracyjny gradient */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '180px',
        height: '180px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.05), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Nagłówek sekcji */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--nav-active)',
            marginBottom: '2px',
          }}>
            The Oracle
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--muted)',
          }}>
            {region} &middot; {okres}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '0.68rem',
            fontWeight: 600,
            background: status.bg,
            color: status.color,
            border: `1px solid ${status.border}`,
          }}>
            {status.label}
          </div>
        </div>
      </div>

      {/* Główne KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '16px',
      }}>
        {/* Stopa bezrobocia */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '2.8rem',
            fontWeight: 800,
            color: 'var(--text)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}>
            {displayedStopa}
            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--muted)', marginLeft: '2px' }}>%</span>
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            marginTop: '6px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {stopaLabel}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              background: deltaMoM > 0 ? 'rgba(220,38,38,0.08)' : deltaMoM < 0 ? 'rgba(22,163,74,0.08)' : 'rgba(0,0,0,0.04)',
              color: deltaMoM > 0 ? '#dc2626' : deltaMoM < 0 ? '#16a34a' : 'var(--muted)',
              border: `1px solid ${deltaMoM > 0 ? 'rgba(220,38,38,0.15)' : deltaMoM < 0 ? 'rgba(22,163,74,0.15)' : 'var(--border)'}`,
            }}>
              m/m {fmt(deltaMoM)} pp
            </span>
            <span style={{
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 500,
              fontFamily: "'JetBrains Mono', monospace",
              background: 'rgba(0,0,0,0.03)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
            }}>
              r/r {fmt(deltaYoY)} pp
            </span>
          </div>
        </div>

        {/* Liczba bezrobotnych */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1,
          }}>
            {displayedBezr}
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            marginTop: '6px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Bezrobotnych ogółem
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              background: bezrDeltaMoM > 0 ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)',
              color: bezrDeltaMoM > 0 ? '#dc2626' : '#16a34a',
            }}>
              m/m {fmtInt(bezrDeltaMoM)}
            </span>
            {bezrDeltaYoY != null && (
              <span style={{
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '0.65rem',
                fontWeight: 500,
                fontFamily: "'JetBrains Mono', monospace",
                background: 'rgba(0,0,0,0.03)',
                color: 'var(--muted)',
              }}>
                r/r {fmtInt(bezrDeltaYoY)}
              </span>
            )}
          </div>
        </div>

        {/* Trend 12M */}
        <div>
          <div style={{ marginBottom: '8px' }}>
            <Sparkline data={trend12m} color="#2563eb" width={120} height={40} />
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Trend 12 miesięcy
          </div>
          {ratio && (
            <div style={{
              marginTop: '6px',
              fontSize: '0.65rem',
              color: ratioAlert ? '#dc2626' : 'var(--muted)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Napływ/odpływ: <strong>{ratio}</strong> {ratioAlert && '(!)'}
            </div>
          )}
        </div>

        {/* Pozycja w województwie */}
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '1.8rem',
            fontWeight: 700,
            color: 'var(--nav-active)',
            lineHeight: 1,
          }}>
            {pozycjaWoj || '—'}
          </div>
          <div style={{
            fontSize: '0.68rem',
            color: 'var(--muted)',
            marginTop: '6px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Pozycja w woj.
          </div>
          {percentyl != null && (
            <div style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                flex: 1,
                height: '6px',
                background: 'var(--bg3)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${percentyl}%`,
                  height: '100%',
                  background: percentyl > 75 ? '#16a34a' : percentyl > 50 ? '#2563eb' : percentyl > 25 ? '#f97316' : '#dc2626',
                  borderRadius: '3px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{
                fontSize: '0.62rem',
                color: 'var(--muted)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {percentyl}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight */}
      {insight && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(30,58,110,0.06))',
          border: '1px solid rgba(37,99,235,0.12)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'rgba(37,99,235,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--nav-active)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '4px',
            }}>
              Analiza sytuacji
            </div>
            <div style={{
              fontSize: '0.76rem',
              color: 'var(--text)',
              lineHeight: 1.5,
            }}>
              {insight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
