import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import MovieModal from './MovieModal';
import './MovieCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function MovieCard({ movie, libraryStatus, onAdd, onRemove, country = 'AR', showStreaming = false }) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  return (
    <>
      <div className="movie-card" onClick={() => setModalOpen(true)}>
        <div className="card-poster-wrap">
          <img
            src={movie.poster_path || PLACEHOLDER}
            alt={movie.title}
            className="card-poster"
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
          <div className="card-overlay">
            <span className="card-expand-hint">{t.card.more}</span>
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
      </div>

      {modalOpen && (
        <MovieModal
          movie={movie}
          onClose={() => setModalOpen(false)}
          type="search"
          libraryStatus={libraryStatus}
          onAdd={onAdd}
          onRemove={onRemove}
          country={country}
        />
      )}
    </>
  );
}
