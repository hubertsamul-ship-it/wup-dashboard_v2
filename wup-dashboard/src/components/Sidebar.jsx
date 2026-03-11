import React from 'react';
import {
  LayoutDashboard, Users, TrendingDown, Briefcase,
  Wallet, FileBarChart, Map,
  ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';

const NAV = [
  { id: 'pulpit',        Icon: LayoutDashboard, label: 'Przegląd',          section: 'Główne' },
  { id: 'bezrobotni',    Icon: Users,           label: 'Osoby bezrobotne',  section: null },
  { id: 'stopa',         Icon: TrendingDown,    label: 'Stopa bezrobocia',  section: null },
  { id: 'pracujacy',     Icon: Briefcase,       label: 'Pracujący',         section: null },
  { id: 'wynagrodzenia', Icon: Wallet,          label: 'Wynagrodzenia',     section: null },
  { id: 'zwolnienia',    Icon: FileBarChart,    label: 'Zwolnienia',        section: null },
  { id: 'powiaty',       Icon: Map,             label: 'Powiaty',           section: 'Analityka' },
];

export default function Sidebar({ active, onNav, collapsed, onToggle }) {
  return (
    <div style={{
      width: collapsed ? '58px' : '256px',
      minWidth: collapsed ? '58px' : '256px',
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      transition: 'width 0.22s ease, min-width 0.22s ease',
      flexShrink: 0,
    }}>

      {/* Dekoracja */}
      <div style={{
        position: 'absolute', top: '-60px', left: '-60px',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,58,110,0.06), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Brand / Logo */}
      <div style={{
        padding: collapsed ? '12px 0' : '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '82px', flexShrink: 0,
        transition: 'padding 0.22s ease',
      }}>
        {collapsed ? (
          <img
            src="/logo.png"
            alt="WUP"
            style={{ width: '30px', height: '30px', objectFit: 'contain' }}
          />
        ) : (
          <>
            <img
              src="/logo.png"
              alt="Mazostat"
              style={{ width: '224px', maxHeight: '66px', objectFit: 'contain', marginBottom: '8px' }}
            />
            <div style={{
              fontSize: 'var(--font-xs)', color: 'var(--muted)', textAlign: 'center',
              lineHeight: 1.55, letterSpacing: '0.07em',
            }}>
              Wojewódzki Urząd Pracy<br />w Warszawie
            </div>
          </>
        )}
      </div>

      {/* Nawigacja */}
      <div style={{ padding: collapsed ? '10px 6px' : '12px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV.map((item, i) => (
          <React.Fragment key={item.id}>
            {item.section && !collapsed && (
              <div style={{
                fontSize: 'var(--font-xs)', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'var(--muted2)',
                margin: `${i === 0 ? '0' : '12px'} 6px 5px`,
              }}>
                {item.section}
              </div>
            )}
            {item.section && collapsed && i !== 0 && (
              <div style={{ height: '1px', background: 'var(--border)', margin: '5px 6px' }} />
            )}
            <NavItem
              item={item}
              isActive={active === item.id}
              onClick={() => onNav(item.id)}
              collapsed={collapsed}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '8px 6px' : '10px 12px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <>
            <button style={{
              width: '100%', padding: '7px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--muted)', fontSize: 'var(--font-sm)', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <RefreshCw size={12} />
              Odśwież dane
            </button>
            <div style={{ marginTop: '7px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {['Osoby bezrobotne · Sty 2026', 'Stopa bezrobocia · Sty 2026', 'Raporty · Gru 2025'].map(s => (
                <div key={s} style={{ fontSize: 'var(--font-xs)', color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)', flexShrink: 0, display: 'inline-block' }} />
                  {s}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={{
              width: '34px', height: '34px',
              background: 'var(--bg3)',
              border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--muted)', fontSize: '0.85rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title="Odśwież dane">
              <RefreshCw size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Przycisk toggle */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Rozwiń panel' : 'Zwiń panel'}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-1px',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '48px',
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderLeft: 'none',
          borderRadius: '0 6px 6px 0',
          color: 'var(--muted2)',
          cursor: 'pointer',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s, background 0.15s',
          lineHeight: 1,
          padding: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--bg3)';
          e.currentTarget.style.color = 'var(--text)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg2)';
          e.currentTarget.style.color = 'var(--muted2)';
        }}
      >
        {collapsed
          ? <ChevronRight size={11} />
          : <ChevronLeft size={11} />
        }
      </button>
    </div>
  );
}

function NavItem({ item, isActive, onClick, collapsed }) {
  const { Icon } = item;
  const iconColor = isActive ? 'var(--nav-active)' : 'var(--muted)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : '9px',
        padding: collapsed ? '5px 0' : '9px 10px',
        borderRadius: '9px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '1px',
        position: 'relative',
        justifyContent: collapsed ? 'center' : 'flex-start',
        background: isActive ? 'rgba(30,58,110,0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(30,58,110,0.15)' : '1px solid transparent',
      }}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg3)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {isActive && !collapsed && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '55%', background: 'var(--nav-active)', borderRadius: '0 2px 2px 0',
        }} />
      )}
      <div style={{
        width: '28px', height: '28px', borderRadius: '7px',
        background: isActive ? 'rgba(30,58,110,0.10)' : 'rgba(0,0,0,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.2s',
      }}>
        <Icon size={15} color={iconColor} strokeWidth={isActive ? 2.2 : 1.8} />
      </div>
      {!collapsed && (
        <span style={{
          fontSize: '1rem', fontWeight: isActive ? 600 : 500,
          color: isActive ? 'var(--nav-active)' : 'var(--muted)',
          transition: 'color 0.2s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}>
          {item.label}
        </span>
      )}
    </div>
  );
}
