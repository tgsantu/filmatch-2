import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MovieCard from './MovieCard';
import { useLanguage } from '../LanguageContext';
import './Search.css';

export default function Search({ library, getMovieStatus, onAdd, onRemove, country }) {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searched, setSearched] = useState(false);

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(false);

  const [related, setRelated] = useState([]);

  const fetchTrending = () => {
    setTrendingLoading(true);
    setTrendingError(false);
    axios.get('/api/home/trending', { params: { country, lang } })
      .then(r => setTrending(r.data))
      .catch(() => setTrendingError(true))
      .finally(() => setTrendingLoading(false));
  };

  useEffect(() => { fetchTrending(); }, [country, lang]); // eslint-disable-line

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
        axios.get(`/api/home/similar/${m.tmdb_id}`, { params: { lang } })
          .then(r => ({ baseTitle: m.title, movies: r.data }))
          .catch(() => null)
      )
    ).then(sections => setRelated(sections.filter(Boolean)));
  }, [seenKey, lang]); // eslint-disable-line

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError('');
    setSearched(true);
    try {
      const res = await axios.get('/api/movies/search', { params: { query: q, lang } });
      setResults(res.data);
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [query, lang]);

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
          placeholder={t.home.searchPlaceholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
        />
        {searched
          ? <button className="btn btn-ghost" onClick={clearSearch}>{t.home.clear}</button>
          : <button className="btn btn-primary" onClick={search} disabled={searchLoading || !query.trim()}>
              {searchLoading ? <span className="spinner" /> : t.home.search}
            </button>
        }
      </div>

      {!showHome && (
        <>
          {searchLoading && <div className="loading"><span className="spinner" /></div>}
          {searchError && <div className="error-msg">{searchError}</div>}
          {!searchLoading && searched && results.length === 0 && !searchError && (
            <div className="empty-state">
              <h3>{t.home.noResults}</h3>
              <p>{t.home.noResultsDesc}</p>
            </div>
          )}
          {!searchLoading && results.length > 0 && (
            <>
              <p className="results-count">{t.home.results(results.length)}</p>
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

      {showHome && (
        <>
          <HomeSection
            title={t.home.trendingNow}
            movies={trending}
            loading={trendingLoading}
            error={trendingError}
            onRetry={fetchTrending}
            getMovieStatus={getMovieStatus}
            onAdd={onAdd}
            onRemove={onRemove}
            serverWakingUp={t.home.serverWakingUp}
            tryAgain={t.home.tryAgain}
          />
          {related.map(({ baseTitle, movies }) => (
            <HomeSection
              key={baseTitle}
              title={<>{t.home.becauseYouWatched} <span>{baseTitle}</span></>}
              movies={movies}
              loading={false}
              getMovieStatus={getMovieStatus}
              onAdd={onAdd}
              onRemove={onRemove}
              serverWakingUp={t.home.serverWakingUp}
              tryAgain={t.home.tryAgain}
            />
          ))}
        </>
      )}
    </div>
  );
}

function HomeSection({ title, movies, loading, error, onRetry, getMovieStatus, onAdd, onRemove, serverWakingUp, tryAgain }) {
  return (
    <section className="home-section">
      <h2 className="home-section-title">{title}</h2>
      {loading ? (
        <div className="home-row-skeleton">
          {[...Array(5)].map((_, i) => <div key={i} className="home-row-card skeleton-card" />)}
        </div>
      ) : error || movies.length === 0 ? (
        <div className="home-row-empty">
          <span>{serverWakingUp}</span>
          <button className="home-retry-btn" onClick={onRetry}>{tryAgain}</button>
        </div>
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
