import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { useLanguage } from './LanguageContext';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Search from './components/Search';
import Library from './components/Library';
import Recommendations from './components/Recommendations';
import Quiz from './components/Quiz';
import Settings from './components/Settings';
import './App.css';

export default function App() {
  const { lang, setLang, t } = useLanguage();
  const [user, setUser] = useState(undefined); // undefined = loading
  const [tab, setTab] = useState('search');
  const [library, setLibrary] = useState([]);
  const [settings, setSettings] = useState({ country: 'AR' });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('filmatch-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('filmatch-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t2 => t2 === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  useEffect(() => {
    if (!user) { setLibrary([]); return; }
    const ref = collection(db, 'users', user.uid, 'library');
    return onSnapshot(ref, (snap) => {
      setLibrary(snap.docs.map(d => d.data()).sort((a, b) => new Date(b.added_at) - new Date(a.added_at)));
    });
  }, [user]);

  useEffect(() => {
    if (!user) { setSettingsLoaded(false); return; }
    getDoc(doc(db, 'users', user.uid, 'settings', 'main'))
      .then(snap => { if (snap.exists()) setSettings(snap.data()); })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, [user]);

  const addToLibrary = useCallback(async (movie, status) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'library', String(movie.tmdb_id)), {
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      poster_path: movie.poster_path || null,
      release_year: movie.release_year || null,
      genres: movie.genres || [],
      overview: movie.overview || '',
      status,
      added_at: new Date().toISOString(),
    });
  }, [user]);

  const removeFromLibrary = useCallback(async (tmdbId) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'library', String(tmdbId)));
  }, [user]);

  const updateLibraryStatus = useCallback(async (tmdbId, status) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'library', String(tmdbId)), { status });
  }, [user]);

  const saveSettings = useCallback(async (newSettings) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'settings', 'main'), newSettings);
    setSettings(newSettings);
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;
    const updated = { ...settings, onboardingDone: true };
    await setDoc(doc(db, 'users', user.uid, 'settings', 'main'), updated);
    setSettings(updated);
  }, [user, settings]);

  const getMovieStatus = useCallback((tmdbId) => {
    const found = library.find(m => m.tmdb_id === tmdbId);
    return found ? found.status : null;
  }, [library]);

  const tabs = [
    { id: 'search',          label: t.tabs.home,            icon: '🏠' },
    { id: 'library',         label: t.tabs.library,         icon: '📚' },
    { id: 'recommendations', label: t.tabs.recommendations, icon: '⭐' },
    { id: 'quiz',            label: t.tabs.discover,        icon: '🎬' },
    { id: 'settings',        label: t.tabs.settings,        icon: '⚙️' },
  ];

  if (user === undefined) {
    return <div className="loading" style={{ height: '100vh' }}><span className="spinner" /></div>;
  }

  if (!user) return <Auth />;

  return (
    <div className="app">
      {settingsLoaded && !settings.onboardingDone && (
        <Onboarding onDone={completeOnboarding} />
      )}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <img src={theme === 'light' ? '/logonotextlightbg.png' : '/logonotext.png'} alt="" className="logo-img" />
            <span className="logo-text">theFilMatch</span>
          </div>
          <nav className="nav">
            {tabs.map(tab2 => (
              <button
                key={tab2.id}
                className={`nav-btn ${tab === tab2.id ? 'active' : ''}`}
                onClick={() => setTab(tab2.id)}
              >
                <span className="nav-tab-label">{tab2.label}</span>
              </button>
            ))}
          </nav>
          <div className="user-menu">
            <div className="lang-toggle">
              <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>ES</button>
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            <span className="user-email">{user.email || user.displayName}</span>
            <button className="signout-btn" onClick={() => signOut(auth)}>{t.common.signOut}</button>
          </div>
        </div>
      </header>

      <main className="main">
        {tab === 'search' && (
          <Search
            library={library}
            getMovieStatus={getMovieStatus}
            onAdd={addToLibrary}
            onRemove={removeFromLibrary}
            country={settings.country}
          />
        )}
        {tab === 'library' && (
          <Library
            library={library}
            onRemove={removeFromLibrary}
            onStatusChange={updateLibraryStatus}
            country={settings.country}
          />
        )}
        {tab === 'recommendations' && (
          <Recommendations library={library} onAdd={addToLibrary} country={settings.country} />
        )}
        {tab === 'quiz' && <Quiz onAdd={addToLibrary} country={settings.country} />}
        {tab === 'settings' && <Settings settings={settings} onSave={saveSettings} onSignOut={() => signOut(auth)} />}
      </main>



      <nav className="bottom-nav">
        {tabs.map(tab2 => (
          <button
            key={tab2.id}
            className={`nav-btn ${tab === tab2.id ? 'active' : ''}`}
            onClick={() => setTab(tab2.id)}
          >
            <span className="nav-tab-icon">{tab2.icon}</span>
            <span className="nav-tab-label">{tab2.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
