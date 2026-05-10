import React, { useState } from 'react';
import axios from 'axios';
import RecommendationCard from './RecommendationCard';
import { useLanguage } from '../LanguageContext';
import './Recommendations.css';

export default function Recommendations({ library, onAdd, country }) {
  const { lang, t } = useLanguage();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    const seenMovies = library.filter(m => m.status === 'seen');
    if (seenMovies.length === 0) {
      setError(t.recommendations.noSeenMovies);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/recommendations', { movies: seenMovies, library, lang });
      const libraryIds = new Set(library.map(m => m.tmdb_id));
      setRecs(res.data.filter(m => !libraryIds.has(m.tmdb_id)));
      setGenerated(true);
    } catch (err) {
      setError(err.response?.data?.error || t.recommendations.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">{t.recommendations.title}</h1>
      <p className="section-subtitle">{t.recommendations.subtitle}</p>

      {!generated && !loading && (
        <div className="rec-prompt">
          <div className="rec-prompt-icon">✨</div>
          <h2>{t.recommendations.personalizedPicks}</h2>
          <p>{t.recommendations.aiAnalyzes}</p>
          {error && <div className="error-msg" style={{ textAlign: 'left', width: '100%', maxWidth: 400 }}>{error}</div>}
          <button className="btn btn-primary rec-btn" onClick={generate}>{t.recommendations.generate}</button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <span className="spinner" />{t.recommendations.generating}
        </div>
      )}

      {!loading && generated && (
        <>
          <div className="rec-header">
            <p className="results-count">{t.recommendations.results(recs.length)}</p>
            <button className="btn btn-ghost" onClick={generate} disabled={loading}>{t.recommendations.refresh}</button>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div className="grid">
            {recs.map((movie, i) => (
              <RecommendationCard key={i} movie={movie} onAdd={onAdd} country={country} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
