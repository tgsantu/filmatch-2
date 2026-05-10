import React, { useState } from 'react';
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

export default function Settings({ settings, onSave }) {
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
      <h1 className="section-title">Settings</h1>

      <div className="settings-card">
        <h2 className="settings-section-title">Streaming Region</h2>
        <p className="settings-desc">Select your country to get accurate streaming availability.</p>
        <div className="setting-row">
          <label className="setting-label">Country</label>
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
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="settings-card settings-info">
        <h2 className="settings-section-title">About Filmatch</h2>
        <div className="info-grid">
          <div className="info-item"><span className="info-icon"><img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg" alt="TMDB" className="tmdb-logo" /></span><div><p className="info-title">TMDB</p><p className="info-desc">Movie data, posters & metadata</p></div></div>
          <div className="info-item"><span className="info-icon">📺</span><div><p className="info-title">Movie of the Night API</p><p className="info-desc">Real-time streaming platform data</p></div></div>
          <div className="info-item"><span className="info-icon">💤</span><div><p className="info-title">Free hosting</p><p className="info-desc">To keep this app free, the server sleeps when idle. AI features may take up to 30 s on first use — just wait a moment!</p></div></div>
        </div>
      </div>
    </div>
  );
}
