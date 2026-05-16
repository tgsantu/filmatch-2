import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import MovieModal from './MovieModal';
import './Library.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function Library({ library, onRemove, onStatusChange, country }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('seen');
  const filtered = library.filter(m => m.status === filter);

  const filters = [
    { value: 'seen', label: t.library.seen },
    { value: 'want_to_watch', label: t.library.watchlist },
  ];

  const emptyMsg = filter === 'seen' ? t.library.emptySeen : t.library.emptyWatchlist;

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
  const [modalOpen, setModalOpen] = useState(false);
  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  return (
    <>
      <div className="lib-card" onClick={() => setModalOpen(true)} style={{ cursor: 'pointer' }}>
        <div className="lib-status-bar" onClick={e => e.stopPropagation()}>
          <button
            className={`status-pill ${movie.status === 'seen' ? 'seen' : 'want'}`}
            onClick={() => onStatusChange(movie.tmdb_id, movie.status === 'seen' ? 'want_to_watch' : 'seen')}
          >
            {movie.status === 'seen' ? t.library.statusSeen : t.library.statusWatchlist}
          </button>
          <button className="remove-btn" onClick={() => onRemove(movie.tmdb_id)}>✕</button>
        </div>

        <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--surface2)' }}>
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
      </div>

      {modalOpen && (
        <MovieModal
          movie={movie}
          onClose={() => setModalOpen(false)}
          type="library"
          onRemove={(id) => { onRemove(id); setModalOpen(false); }}
          onStatusChange={onStatusChange}
          country={country || 'AR'}
        />
      )}
    </>
  );
}
