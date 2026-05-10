import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import './RecommendationCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function RecommendationCard({ movie, onAdd, country = 'AR' }) {
  const { t } = useLanguage();
  const [streaming, setStreaming] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(null);
  const [showFullOverview, setShowFullOverview] = useState(false);

  const toggle = async () => {
    if (!expanded && movie.tmdb_id && !streaming) {
      setLoadingStream(true);
      try {
        const res = await axios.get(`/api/streaming/${movie.tmdb_id}?country=${country}`);
        setStreaming(res.data);
      } catch {
        setStreaming({ platforms: [] });
      } finally {
        setLoadingStream(false);
      }
    }
    setExpanded(e => !e);
  };

  const handleAdd = async (status) => {
    if (!movie.tmdb_id) return;
    await onAdd({ ...movie, release_year: movie.year }, status);
    setAdded(status);
  };

  return (
    <div className={`rec-card ${expanded ? 'expanded' : ''}`}>
      <div onClick={toggle} style={{ cursor: 'pointer', position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--surface2)' }}>
        <img
          src={movie.poster_path || PLACEHOLDER}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <div className="ai-badge">{t.recCard.aiPick}</div>
      </div>

      <div className="card-info">
        <h3 className="card-title">{movie.title}</h3>
        <p className="card-year">{movie.year || '—'}</p>
      </div>

      {expanded && (
        <div className="card-detail">
          {movie.overview && (
            <div>
              <p className={`card-overview ${showFullOverview ? 'full' : ''}`}>{movie.overview}</p>
              {movie.overview.length > 150 && (
                <button className="read-more-btn" onClick={() => setShowFullOverview(v => !v)}>
                  {showFullOverview ? t.recCard.readLess : t.recCard.readMore}
                </button>
              )}
            </div>
          )}
          {movie.reason && <p className="card-reason"><span>{t.recCard.whyYoullLove}</span> {movie.reason}</p>}

          <div className="streaming-section">
            <p className="streaming-label">{t.recCard.whereToWatch}</p>
            {loadingStream && <p className="streaming-loading">{t.recCard.loadingStream}</p>}
            {streaming && streaming.platforms.length === 0 && <p className="streaming-none">{t.recCard.noStreaming}</p>}
            {streaming && streaming.platforms.length > 0 && (
              <div className="platform-list">
                {streaming.platforms.map((p, i) => (
                  <a key={i} href={p.link} target="_blank" rel="noopener noreferrer" className="platform-tag">
                    {p.service} <span className="platform-type">({p.type})</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {!added ? (
            <div className="card-actions">
              <button className="action-btn" onClick={() => handleAdd('seen')}>{t.recCard.markSeen}</button>
              <button className="action-btn" onClick={() => handleAdd('want_to_watch')}>{t.recCard.addWatchlist}</button>
            </div>
          ) : (
            <p className="added-msg">{added === 'seen' ? t.recCard.addedSeen : t.recCard.addedWatchlist}</p>
          )}
        </div>
      )}
    </div>
  );
}
