import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Search from './components/Search';
import Library from './components/Library';
import Recommendations from './components/Recommendations';
import Quiz from './components/Quiz';
import Settings from './components/Settings';
import './App.css';

const TABS = [
  { id: 'search', label: 'Search' },
  { id: 'library', label: 'Library' },
  { id: 'recommendations', label: 'For You' },
  { id: 'quiz', label: 'Discover' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [tab, setTab] = useState('search');
  const [library, setLibrary] = useState([]);

  const fetchLibrary = async () => {
    try {
      const res = await axios.get('/api/library');
      setLibrary(res.data);
    } catch {}
  };

  useEffect(() => { fetchLibrary(); }, []);

  const handleLibraryUpdate = () => fetchLibrary();

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">Filmatch</span>
          </div>
          <nav className="nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === 'library' && library.length > 0 && (
                  <span className="badge">{library.length}</span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {tab === 'search' && <Search library={library} onLibraryUpdate={handleLibraryUpdate} />}
        {tab === 'library' && <Library library={library} onLibraryUpdate={handleLibraryUpdate} />}
        {tab === 'recommendations' && <Recommendations />}
        {tab === 'quiz' && <Quiz />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
