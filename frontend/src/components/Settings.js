import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

export default function Settings() {
  const [settings, setSettings] = useState({ country: 'AR' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/settings').then(res => setSettings(res.data)).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await axios.put('/api/settings', { country: settings.country });
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">Settings</h1>

      <div className="settings-card">
        <h2 className="settings-section-title">Streaming Region</h2>
        <p className="settings-desc">Select your country to get accurate streaming availability for movies in your library.</p>

        <div className="setting-row">
          <label className="setting-label">Country</label>
          <select
            className="setting-select"
            value={settings.country || 'AR'}
            onChange={e => setSettings(s => ({ ...s, country: e.target.value }))}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="settings-card settings-info">
        <h2 className="settings-section-title">About Filmatch</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🎬</span>
            <div>
              <p className="info-title">TMDB</p>
              <p className="info-desc">Movie data, posters & metadata</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📺</span>
            <div>
              <p className="info-title">Streaming Availability API</p>
              <p className="info-desc">Real-time streaming platform data</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🤖</span>
            <div>
              <p className="info-title">Groq + LLaMA 3.3 70B</p>
              <p className="info-desc">AI-powered recommendations & quiz</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">💾</span>
            <div>
              <p className="info-title">SQLite</p>
              <p className="info-desc">All data stored locally on your device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
