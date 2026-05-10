import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MovieCard from './MovieCard';
import './Search.css';

export default function Search({ library, getMovieStatus, onAdd, onRemove }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searched, setSearched] = useState(false);

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(false);

  const [related, setRelated] = useState([]);

  // Fetch trending once on mount
  useEffect(() => {
    axios.get('/api/home/trending')
      .then(r => setTrending(r.data))
      .catch(() => setTrendingError(true))
      .finally(() => setTrendingLoading(false));
  }, []);

  // Fetch "because you watched" when seen list changes
  const seenKey = library
    .filter(m => m.status === 'seen' && m.tmdb_id)
    .slice(0, 2)
    .map(m => m.tmdb_id)
    .join(',');

  useEffect(() => {
    const picks = library
      .filter(m => m.status === 'seen' && m.tmdb_id)
      .slice(0, 2);
    if (picks.length === 0) { setRelated([]); return; }
    Promise.all(
      picks.map(m =>
        axios.get(`/api/home/similar/${m.tmdb_id}`)
          .then(r => ({ baseTitle: m.title, movies: r.data }))
          .catch(() => null)
      )
    ).then(sections => setRelated(sections.filter(Boolean)));
  }, [seenKey]); // seenKey is a stable primitive derived from library

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError('');
    setSearched(true);
    try {
      const res = await axios.get('/api/movies/search', { params: { query: q } });
      setResults(res.data);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearched(false);
    setResults([]);
    setSearchError('');
  };

  const handleKey = (e) => { if (e.key === 'Enter') search(); };

  const showHome = !searched;

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search for a movie..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
        />
        {searched
          ? <button className="btn btn-ghost" onClick={clearSearch}>✕ Clear</button>
          : <button className="btn btn-primary" onClick={search} disabled={searchLoading || !query.trim()}>
              {searchLoading ? <span className="spinner" /> : 'Search'}
            </button>
        }
      </div>

      {/* ── Search results ── */}
      {!showHome && (
        <>
          {searchLoading && <div className="loading"><span className="spinner" /> Searching...</div>}
          {searchError && <div className="error-msg">{searchError}</div>}
          {!searchLoading && searched && results.length === 0 && !searchError && (
            <div className="empty-state">
              <h3>No results found</h3>
              <p>Try a different title or check for typos.</p>
            </div>
          )}
          {!searchLoading && results.length > 0 && (
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
                    showStreaming
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Home content ── */}
      {showHome && (
        <>
          <HomeSection
            title="Trending Now"
            movies={trending}
            loading={trendingLoading}
            error={trendingError}
            getMovieStatus={getMovieStatus}
            onAdd={onAdd}
            onRemove={onRemove}
          />
          {related.map(({ baseTitle, movies }) => (
            <HomeSection
              key={baseTitle}
              title={<>Because you watched <span>{baseTitle}</span></>}
              movies={movies}
              loading={false}
              getMovieStatus={getMovieStatus}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))}
        </>
      )}
    </div>
  );
}

function HomeSection({ title, movies, loading, error, getMovieStatus, onAdd, onRemove }) {
  return (
    <section className="home-section">
      <h2 className="home-section-title">{title}</h2>
      {loading ? (
        <div className="home-row-skeleton">
          {[...Array(5)].map((_, i) => <div key={i} className="home-row-card skeleton-card" />)}
        </div>
      ) : error || movies.length === 0 ? (
        <p className="home-row-empty">Could not load movies. The server may be waking up — try again in a moment.</p>
      ) : (
        <div className="home-row">
          {movies.map(movie => (
            <div className="home-row-card" key={movie.tmdb_id}>
              <MovieCard
                movie={movie}
                libraryStatus={getMovieStatus(movie.tmdb_id)}
                onAdd={onAdd}
                onRemove={onRemove}
                showStreaming
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
