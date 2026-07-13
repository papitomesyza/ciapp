import { useEffect, useState, useCallback } from 'react';
import { getToken, setToken, api } from './api.js';
import { todayISO } from './nutrition.js';
import Login from './components/Login.jsx';
import BottomNav from './components/BottomNav.jsx';
import LogSheet from './components/LogSheet.jsx';
import Today from './pages/Today.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [page, setPage] = useState('today');
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    function handleUnauthorized() {
      setAuthed(false);
    }
    window.addEventListener('year28:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('year28:unauthorized', handleUnauthorized);
  }, []);

  const handleNavSelect = useCallback((id) => {
    if (id === 'log') {
      setShowLogSheet(true);
    } else {
      setPage(id);
    }
  }, []);

  async function handleLogged(entry) {
    await api.createEntry({ ...entry, date: todayISO() });
    setRefreshKey((k) => k + 1);
  }

  function handleLoggedOut() {
    setToken(null);
    setAuthed(false);
  }

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />;
  }

  return (
    <div className="app-shell">
      {page === 'today' && <Today key={refreshKey} />}
      {page === 'history' && <History key={refreshKey} />}
      {page === 'settings' && <Settings onLoggedOut={handleLoggedOut} />}

      <BottomNav active={showLogSheet ? 'log' : page} onSelect={handleNavSelect} />

      {showLogSheet && (
        <LogSheet
          defaultMeal="snack"
          onClose={() => setShowLogSheet(false)}
          onLogged={async (entry) => {
            await handleLogged(entry);
          }}
        />
      )}
    </div>
  );
}
