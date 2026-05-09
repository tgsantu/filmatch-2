import React, { useState } from 'react';
import axios from 'axios';
import './MovieCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function MovieCard({ movie, libraryStatus, onLibraryUpdate, showStreaming = false }) {
  const [status, setStatus] = useState(libraryStatus || null);
  const [streaming, setStreaming] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleStatusChange = async (newStatus) => {
    try {
      if (status === newStatus) {
        await axios.delete(`/api/library/${movie.tmdb_id}`);
        setStatus(null);
      } else {
        await axios.post('/api/library', {
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_year: movie.release_year,
          genres: movie.genres,
          overview: movie.overview,
          status: newStatus,
        });
        setStatus(newStatus);
      }
      if (onLibraryUpdate) onLibraryUpdate();
    } catch (err) {
      console.error('Library update failed', err);
    }
  };

  const fetchStreaming = async () => {
    if (!movie.tmdb_id || streaming) return;
    setLoadingStream(true);
    try {
      const res = await axios.get(`/api/streaming/${movie.tmdb_id}`);
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
          <span className="card-expand-hint">{expanded ? 'Less' : 'More'}</span>
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
          {movie.overview && <p className="card-overview">{movie.overview}</p>}
          {movie.reason && <p className="card-reason"><span>Why:</span> {movie.reason}</p>}

          {showStreaming && (
            <div className="streaming-section">
              <p className="streaming-label">Where to watch</p>
              {loadingStream && <p className="streaming-loading">Loading...</p>}
              {streaming && streaming.platforms.length === 0 && (
                <p className="streaming-none">Not available in your region</p>
              )}
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
              className={`action-btn ${status === 'seen' ? 'active-seen' : ''}`}
              onClick={() => handleStatusChange('seen')}
            >
              {status === 'seen' ? '✓ Seen' : 'Mark Seen'}
            </button>
            <button
              className={`action-btn ${status === 'want_to_watch' ? 'active-want' : ''}`}
              onClick={() => handleStatusChange('want_to_watch')}
            >
              {status === 'want_to_watch' ? '★ Watchlist' : 'Watchlist'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
