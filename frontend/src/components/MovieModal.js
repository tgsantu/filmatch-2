import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../LanguageContext';
import './MovieModal.css';
import './MovieCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function MovieModal({
  movie, onClose,
  type = 'search',
  libraryStatus, onAdd, onRemove, onStatusChange,
  country = 'AR',
  preloadedStreaming = null,
}) {
  const { lang, t } = useLanguage();
  const [streaming, setStreaming] = useState(preloadedStreaming);
  const [loadingStream, setLoadingStream] = useState(false);
  const [freshOverview, setFreshOverview] = useState(null);
  const [overviewLang, setOverviewLang] = useState(null);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [added, setAdded] = useState(null);
  const overviewRef = useRef(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch overview in current language
  useEffect(() => {
    if (!movie.tmdb_id || overviewLang === lang) return;
    axios.get(`/api/movies/${movie.tmdb_id}`, { params: { lang } })
      .then(r => { setFreshOverview(r.data.overview || null); setOverviewLang(lang); })
      .catch(() => {});
  }, [lang, movie.tmdb_id]); // eslint-disable-line

  // Fetch streaming if not preloaded
  useEffect(() => {
    if (streaming || !movie.tmdb_id) return;
    setLoadingStream(true);
    axios.get(`/api/streaming/${movie.tmdb_id}?country=${country}`)
      .then(r => setStreaming(r.data))
      .catch(() => setStreaming({ platforms: [] }))
      .finally(() => setLoadingStream(false));
  }, []); // eslint-disable-line

  // Detect clamping
  useEffect(() => {
    if (!overviewRef.current || showFullOverview) return;
    setIsClamped(overviewRef.current.scrollHeight > overviewRef.current.clientHeight);
  });

  const overview = freshOverview !== null ? freshOverview : (movie.overview || '');
  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  const handleAdd = async (status) => {
    setActionLoading(true);
    try {
      if (type === 'recommendation') {
        await onAdd({ ...movie, release_year: movie.year }, status);
        setAdded(status);
      } else {
        if (libraryStatus === status) {
          await onRemove(movie.tmdb_id);
        } else {
          await onAdd(movie, status);
        }
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="modal-top">
          <img
            src={movie.poster_path || PLACEHOLDER}
            alt={movie.title}
            className="modal-poster"
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
          <div className="modal-meta">
            {type === 'recommendation' && (
              <span className="modal-ai-badge">{t.recCard.aiPick}</span>
            )}
            <h2 className="modal-title">{movie.title}</h2>
            <p className="modal-year">{movie.release_year || movie.year || '—'}</p>
            {genres.length > 0 && (
              <div className="card-genres">
                {genres.map((g, i) => (
                  <span key={i} className="genre-tag">{typeof g === 'string' ? g : g.name}</span>
                ))}
              </div>
            )}
            {type === 'library' && (
              <div className="modal-lib-row">
                <button
                  className={`status-pill ${movie.status === 'seen' ? 'seen' : 'want'}`}
                  onClick={() => onStatusChange(movie.tmdb_id, movie.status === 'seen' ? 'want_to_watch' : 'seen')}
                >
                  {movie.status === 'seen' ? t.library.statusSeen : t.library.statusWatchlist}
                </button>
                <button className="remove-btn" onClick={() => { onRemove(movie.tmdb_id); onClose(); }}>✕</button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-body">
          {movie.reason && (
            <p className="card-reason"><span>{t.recCard.whyYoullLove}</span> {movie.reason}</p>
          )}

          {overview && (
            <div>
              <p ref={overviewRef} className={`card-overview ${showFullOverview ? 'full' : ''}`}>{overview}</p>
              {(isClamped || showFullOverview) && (
                <button className="read-more-btn" onClick={() => setShowFullOverview(v => !v)}>
                  {showFullOverview ? t.card.readLess : t.card.readMore}
                </button>
              )}
            </div>
          )}

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

          {type !== 'library' && (
            <div className="card-actions">
              {type === 'recommendation' && added ? (
                <p className="added-msg">{added === 'seen' ? t.recCard.addedSeen : t.recCard.addedWatchlist}</p>
              ) : (
                <>
                  <button
                    className={`action-btn ${libraryStatus === 'seen' ? 'active-seen' : ''}`}
                    onClick={() => handleAdd('seen')}
                    disabled={actionLoading}
                  >
                    {libraryStatus === 'seen' ? t.card.seen : t.card.markSeen}
                  </button>
                  <button
                    className={`action-btn ${libraryStatus === 'want_to_watch' ? 'active-want' : ''}`}
                    onClick={() => handleAdd('want_to_watch')}
                    disabled={actionLoading}
                  >
                    {libraryStatus === 'want_to_watch' ? t.card.watchlist : t.card.addWatchlist}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
