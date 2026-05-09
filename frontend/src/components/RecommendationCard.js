import React, { useState } from 'react';
import axios from 'axios';
import './RecommendationCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function RecommendationCard({ movie }) {
  const [streaming, setStreaming] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(null);

  const toggle = async () => {
    if (!expanded && movie.tmdb_id && !streaming) {
      setLoadingStream(true);
      try {
        const res = await axios.get(`/api/streaming/${movie.tmdb_id}`);
        setStreaming(res.data);
      } catch {
        setStreaming({ platforms: [] });
      } finally {
        setLoadingStream(false);
      }
    }
    setExpanded(e => !e);
  };

  const addToLibrary = async (status) => {
    if (!movie.tmdb_id) return;
    try {
      await axios.post('/api/library', {
        tmdb_id: movie.tmdb_id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_year: movie.year,
        genres: [],
        overview: movie.overview,
        status,
      });
      setAdded(status);
    } catch {}
  };

  return (
    <div className={`rec-card ${expanded ? 'expanded' : ''}`}>
      <div className="card-poster-wrap" onClick={toggle} style={{ cursor: 'pointer', position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--surface2)' }}>
        <img
          src={movie.poster_path || PLACEHOLDER}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        <div className="ai-badge">AI Pick</div>
      </div>

      <div className="card-info">
        <h3 className="card-title">{movie.title}</h3>
        <p className="card-year">{movie.year || '—'}</p>
      </div>

      {expanded && (
        <div className="card-detail">
          {movie.overview && <p className="card-overview">{movie.overview}</p>}
          {movie.reason && (
            <p className="card-reason"><span>Why you'll love it:</span> {movie.reason}</p>
          )}

          <div className="streaming-section">
            <p className="streaming-label">Where to watch</p>
            {loadingStream && <p className="streaming-loading">Loading...</p>}
            {streaming && streaming.platforms.length === 0 && <p className="streaming-none">Not available in your region</p>}
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
              <button className="action-btn" onClick={() => addToLibrary('seen')}>Mark Seen</button>
              <button className="action-btn" onClick={() => addToLibrary('want_to_watch')}>Watchlist</button>
            </div>
          ) : (
            <p className="added-msg">
              {added === 'seen' ? '✓ Added to Seen' : '★ Added to Watchlist'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
