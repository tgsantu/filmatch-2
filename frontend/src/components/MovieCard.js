import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import './MovieCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function MovieCard({ movie, libraryStatus, onAdd, onRemove, country = 'AR', showStreaming = false }) {
  const { t } = useLanguage();
  const [streaming, setStreaming] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      if (libraryStatus === newStatus) {
        await onRemove(movie.tmdb_id);
      } else {
        await onAdd(movie, newStatus);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStreaming = async () => {
    if (!movie.tmdb_id || streaming) return;
    setLoadingStream(true);
    try {
      const res = await axios.get(`/api/streaming/${movie.tmdb_id}?country=${country}`);
      setStreaming(res.data);
    } catch {
      setStreaming({ platforms: [] });
    } finally {
      setLoadingStream(false);
    }
  };

  const toggleExpand = () => {
    if (!expanded && showStreaming) fetchStreaming();
    setExpanded(e => !e);
  };

  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  return (
    <div className={`movie-card ${expanded ? 'expanded' : ''}`}>
      <div className="card-poster-wrap" onClick={toggleExpand}>
        <img
          src={movie.poster_path || PLACEHOLDER}
          alt={movie.title}
          className="card-poster"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <div className="card-overlay">
          <span className="card-expand-hint">{expanded ? t.card.less : t.card.more}</span>
        </div>
      </div>

      <div className="card-info">
        <h3 className="card-title" title={movie.title}>{movie.title}</h3>
        <p className="card-year">{movie.release_year || '—'}</p>
        {genres.length > 0 && (
          <div className="card-genres">
            {genres.slice(0, 2).map((g, i) => (
              <span key={i} className="genre-tag">{typeof g === 'string' ? g : g.name}</span>
            ))}
          </div>
        )}
      </div>

      {expanded && (
        <div className="card-detail">
          {movie.overview && (
            <div>
              <p className={`card-overview ${showFullOverview ? 'full' : ''}`}>{movie.overview}</p>
              {movie.overview.length > 150 && (
                <button className="read-more-btn" onClick={() => setShowFullOverview(v => !v)}>
                  {showFullOverview ? t.card.readLess : t.card.readMore}
                </button>
              )}
            </div>
          )}

          {showStreaming && (
            <div className="streaming-section">
              <p className="streaming-label">{t.card.whereToWatch}</p>
              {loadingStream && <p className="streaming-loading">{t.card.loadingStream}</p>}
              {streaming && streaming.platforms.length === 0 && <p className="streaming-none">{t.card.noStreaming}</p>}
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
          )}

          <div className="card-actions">
            <button
              className={`action-btn ${libraryStatus === 'seen' ? 'active-seen' : ''}`}
              onClick={() => handleStatusChange('seen')}
              disabled={actionLoading}
            >
              {libraryStatus === 'seen' ? t.card.seen : t.card.markSeen}
            </button>
            <button
              className={`action-btn ${libraryStatus === 'want_to_watch' ? 'active-want' : ''}`}
              onClick={() => handleStatusChange('want_to_watch')}
              disabled={actionLoading}
            >
              {libraryStatus === 'want_to_watch' ? t.card.watchlist : t.card.addWatchlist}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
