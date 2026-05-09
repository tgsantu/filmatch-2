import React, { useState } from 'react';
import axios from 'axios';
import RecommendationCard from './RecommendationCard';
import './Recommendations.css';

export default function Recommendations() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/recommendations');
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
          <button className="btn btn-primary rec-btn" onClick={generate}>
            Generate Recommendations
          </button>
        </div>
      )}

      {error && (
        <div>
          <div className="error-msg">{error}</div>
          {!recs.length && (
            <button className="btn btn-secondary" onClick={generate}>Try Again</button>
          )}
        </div>
      )}

      {loading && (
        <div className="loading">
          <span className="spinner" />
          Asking AI for your perfect picks...
        </div>
      )}

      {generated && !loading && recs.length > 0 && (
        <>
          <div className="rec-header">
            <p className="results-count">{recs.length} recommendations for you</p>
            <button className="btn btn-ghost" onClick={generate} disabled={loading}>
              Refresh
            </button>
          </div>
          <div className="grid">
            {recs.map((movie, i) => (
              <RecommendationCard key={i} movie={movie} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
