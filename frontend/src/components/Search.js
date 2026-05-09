import React, { useState, useCallback } from 'react';
import axios from 'axios';
import MovieCard from './MovieCard';
import './Search.css';

export default function Search({ library, getMovieStatus, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await axios.get('/api/movies/search', { params: { query: q } });
      setResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKey = (e) => { if (e.key === 'Enter') search(); };

  return (
    <div>
      <h1 className="section-title">Find Movies</h1>

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a movie..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          autoFocus
        />
        <button className="btn btn-primary" onClick={search} disabled={loading || !query.trim()}>
          {loading ? <span className="spinner" /> : 'Search'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="loading"><span className="spinner" /> Searching...</div>}

      {!loading && searched && results.length === 0 && !error && (
        <div className="empty-state">
          <h3>No results found</h3>
          <p>Try a different title or check for typos.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="results-count">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div className="grid">
            {results.map(movie => (
              <MovieCard
                key={movie.tmdb_id}
                movie={movie}
                libraryStatus={getMovieStatus(movie.tmdb_id)}
                onAdd={onAdd}
                onRemove={onRemove}
                showStreaming={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
