import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import './Library.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function Library({ library, onRemove, onStatusChange, country }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? library : library.filter(m => m.status === filter);

  const filters = [
    { value: 'all', label: t.library.all },
    { value: 'seen', label: t.library.seen },
    { value: 'want_to_watch', label: t.library.watchlist },
  ];

  const emptyMsg = filter === 'all'
    ? t.library.emptyAll
    : filter === 'seen'
    ? t.library.emptySeen
    : t.library.emptyWatchlist;

  return (
    <div>
      <h1 className="section-title">{t.library.title}</h1>
      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="filter-count">
              {f.value === 'all' ? library.length : library.filter(m => m.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <h3>{emptyMsg}</h3>
          <p>{t.library.emptyDesc}</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid">
          {filtered.map(movie => (
            <LibraryCard
              key={movie.tmdb_id}
              movie={movie}
              onRemove={onRemove}
              onStatusChange={onStatusChange}
              country={country}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryCard({ movie, onRemove, onStatusChange, country }) {
  const { t } = useLanguage();
  const [streaming, setStreaming] = useState(null);
  const [loadingStream, setLoadingStream] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  const fetchStreaming = async () => {
    if (streaming || !movie.tmdb_id) return;
    setLoadingStream(true);
    try {
      const res = await axios.get(`/api/streaming/${movie.tmdb_id}?country=${country || 'AR'}`);
      setStreaming(res.data);
    } catch {
      setStreaming({ platforms: [] });
    } finally {
      setLoadingStream(false);
    }
  };

  const toggle = () => {
    if (!expanded) fetchStreaming();
    setExpanded(e => !e);
  };

  return (
    <div className={`lib-card ${expanded ? 'expanded' : ''}`}>
      <div className="lib-status-bar">
        <button
          className={`status-pill ${movie.status === 'seen' ? 'seen' : 'want'}`}
          onClick={() => onStatusChange(movie.tmdb_id, movie.status === 'seen' ? 'want_to_watch' : 'seen')}
        >
          {movie.status === 'seen' ? t.library.statusSeen : t.library.statusWatchlist}
        </button>
        <button className="remove-btn" onClick={() => onRemove(movie.tmdb_id)}>✕</button>
      </div>

      <div onClick={toggle} style={{ cursor: 'pointer', position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--surface2)' }}>
        <img
          src={movie.poster_path || PLACEHOLDER}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
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
                  {showFullOverview ? t.library.readLess : t.library.readMore}
                </button>
              )}
            </div>
          )}
          <div className="streaming-section">
            <p className="streaming-label">{t.library.whereToWatch}</p>
            {loadingStream && <p className="streaming-loading">{t.library.loadingStream}</p>}
            {streaming && streaming.platforms.length === 0 && <p className="streaming-none">{t.library.noStreaming}</p>}
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
        </div>
      )}
    </div>
  );
}
