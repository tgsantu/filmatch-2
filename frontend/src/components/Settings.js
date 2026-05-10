import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './Settings.css';

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
];

export default function Settings({ settings, onSave, onSignOut }) {
  const { t } = useLanguage();
  const [country, setCountry] = useState(settings?.country || 'AR');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await onSave({ country });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <h1 className="section-title">{t.settings.title}</h1>

      <div className="settings-card">
        <h2 className="settings-section-title">{t.settings.streamingRegion}</h2>
        <p className="settings-desc">{t.settings.selectCountry}</p>
        <div className="setting-row">
          <label className="setting-label">{t.settings.country}</label>
          <select
            className="setting-select"
            value={country}
            onChange={e => setCountry(e.target.value)}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? t.settings.saving : saved ? t.settings.saved : t.settings.save}
        </button>
      </div>

      <div className="settings-card settings-info">
        <h2 className="settings-section-title">{t.settings.about}</h2>
        <div className="info-grid">
          <div className="info-item"><span className="info-icon"><img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg" alt="TMDB" className="tmdb-logo" /></span><div><p className="info-title">TMDB</p><p className="info-desc">{t.settings.tmdbDesc}</p></div></div>
          <div className="info-item"><span className="info-icon">📺</span><div><p className="info-title">Movie of the Night API</p><p className="info-desc">{t.settings.movieOfNightDesc}</p></div></div>
          <div className="info-item"><span className="info-icon">💤</span><div><p className="info-title">{t.settings.freeHosting}</p><p className="info-desc">{t.settings.freeHostingDesc}</p></div></div>
          <div className="info-item"><span className="info-icon">👨‍💻</span><div><p className="info-title">{t.settings.credits}</p><p className="info-desc"><a href="https://www.instagram.com/tgsantu17/" target="_blank" rel="noreferrer" className="info-link">@tgsantu17</a> · <a href="mailto:tgsantu17@gmail.com" className="info-link">tgsantu17@gmail.com</a></p></div></div>
        </div>
      </div>

      <div className="settings-signout">
        <button className="btn btn-ghost settings-signout-btn" onClick={onSignOut}>
          {t.common.signOut}
        </button>
      </div>
    </div>
  );
}
