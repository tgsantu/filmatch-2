import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, doc, setDoc, deleteDoc, updateDoc, onSnapshot, getDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Search from './components/Search';
import Library from './components/Library';
import Recommendations from './components/Recommendations';
import Quiz from './components/Quiz';
import Settings from './components/Settings';
import './App.css';

const TABS = [
  { id: 'search', label: 'Home' },
  { id: 'library', label: 'Library' },
  { id: 'recommendations', label: 'For You' },
  { id: 'quiz', label: 'Discover' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [tab, setTab] = useState('search');
  const [library, setLibrary] = useState([]);
  const [settings, setSettings] = useState({ country: 'AR' });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u || null));
  }, []);

  // Firestore library listener
  useEffect(() => {
    if (!user) { setLibrary([]); return; }
    const ref = collection(db, 'users', user.uid, 'library');
    return onSnapshot(ref, (snap) => {
      setLibrary(snap.docs.map(d => d.data()).sort((a, b) => new Date(b.added_at) - new Date(a.added_at)));
    });
  }, [user]);

  // Load settings from Firestore
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
            <img src="/logonotext.png" alt="" className="logo-img" />
            <span className="logo-text">FilMatch</span>
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
          <div className="user-menu">
            <span className="user-email">{user.email || user.displayName}</span>
            <button className="signout-btn" onClick={() => signOut(auth)}>Sign out</button>
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
        {tab === 'settings' && <Settings settings={settings} onSave={saveSettings} />}
      </main>

      <footer className="footer">
        <p>Developed by <a href="https://www.instagram.com/tgsantu17/" target="_blank" rel="noreferrer">@tgsantu17</a></p>
        <p><a href="mailto:tgsantu17@gmail.com">tgsantu17@gmail.com</a></p>
      </footer>

      <nav className="bottom-nav">
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
  );
}
