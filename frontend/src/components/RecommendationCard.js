import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import MovieModal from './MovieModal';
import './RecommendationCard.css';

const PLACEHOLDER = 'https://via.placeholder.com/160x240/18181b/71717a?text=No+Poster';

export default function RecommendationCard({ movie, onAdd, country = 'AR', preloadedStreaming = null }) {
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="rec-card" onClick={() => setModalOpen(true)} style={{ cursor: 'pointer' }}>
        <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden', background: 'var(--surface2)' }}>
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
      </div>

      {modalOpen && (
        <MovieModal
          movie={movie}
          onClose={() => setModalOpen(false)}
          type="recommendation"
          onAdd={onAdd}
          country={country}
          preloadedStreaming={preloadedStreaming}
        />
      )}
    </>
  );
}
