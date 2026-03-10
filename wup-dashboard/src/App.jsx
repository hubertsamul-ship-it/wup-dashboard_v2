import { useState } from 'react';
import './index.css';
import { DataProvider, useAppData } from './context/DataContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Pulpit from './pages/Pulpit';
import Bezrobotni from './pages/Bezrobotni';
import Stopa from './pages/Stopa';
import Pracujacy from './pages/Pracujacy';
import Wynagrodzenia from './pages/Wynagrodzenia';
import Zwolnienia from './pages/Zwolnienia';
import Powiaty from './pages/Powiaty';

function AppShell({ page, setPage, powiatTarget, setPowiatTarget, sidebarCollapsed, setSidebarCollapsed }) {
  const { loading, error, retry } = useAppData();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)' }}>
      <span style={{ fontSize: 22, animation: 'spin 1s linear infinite' }}>⟳</span>
      Ładowanie danych…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'var(--accent)' }}>
      <span style={{ fontSize: 32 }}>⚠</span>
      <strong>Błąd połączenia z backendem</strong>
      <code style={{ fontSize: 13, color: 'var(--muted)' }}>{error}</code>
      <small>Uruchom: <code>uvicorn backend.api.main:app --port 8000</code></small>
      <button
        onClick={retry}
        style={{
          marginTop: 8, padding: '8px 20px', borderRadius: 8,
          background: 'var(--accent)', color: '#fff', border: 'none',
          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        Spróbuj ponownie
      </button>
    </div>
  );

  const pages = {
    pulpit:        <Pulpit onNavPowiaty={p => { if (p.wgm) setPowiatTarget(p.wgm); setPage('powiaty'); }} />,
    bezrobotni:    <Bezrobotni />,
    stopa:         <Stopa />,
    pracujacy:     <Pracujacy />,
    wynagrodzenia: <Wynagrodzenia />,
    zwolnienia:    <Zwolnienia />,
    powiaty:       <Powiaty initialPowiat={powiatTarget} key={powiatTarget} />,
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <Sidebar active={page} onNav={setPage} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(v => !v)} />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar page={page} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 12px', minHeight: 0 }}>
          {pages[page]}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('pulpit');
  const [powiatTarget, setPowiatTarget] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DataProvider>
      <AppShell
        page={page} setPage={setPage}
        powiatTarget={powiatTarget} setPowiatTarget={setPowiatTarget}
        sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}
      />
    </DataProvider>
  );
}
