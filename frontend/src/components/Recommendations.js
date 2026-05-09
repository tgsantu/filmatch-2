import React, { useState } from 'react';
import axios from 'axios';
import RecommendationCard from './RecommendationCard';
import './Recommendations.css';

export default function Recommendations({ library, onAdd, country }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    const seenMovies = library.filter(m => m.status === 'seen');
    if (seenMovies.length === 0) {
      setError('Add some movies to your "Seen" list first to get recommendations.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/recommendations', { movies: seenMovies });
      setRecs(res.data);
      setGenerated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="section-title">For You</h1>
      <p className="section-subtitle">AI-powered recommendations based on your "Seen" list</p>

      {!generated && !loading && (
        <div className="rec-prompt">
          <div className="rec-prompt-icon">✨</div>
          <h2>Get personalized picks</h2>
          <p>Our AI analyzes your watched movies and finds films you'll love.</p>
          {error && <div className="error-msg" style={{ textAlign: 'left', width: '100%', maxWidth: 400 }}>{error}</div>}
          <button className="btn btn-primary rec-btn" onClick={generate}>Generate Recommendations</button>
        </div>
      )}

      {loading && (
        <div className="loading">
          <span className="spinner" />Asking AI for your perfect picks...
        </div>
      )}

      {!loading && generated && (
        <>
          <div className="rec-header">
            <p className="results-count">{recs.length} recommendations for you</p>
            <button className="btn btn-ghost" onClick={generate} disabled={loading}>Refresh</button>
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
