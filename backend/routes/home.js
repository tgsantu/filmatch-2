const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';

const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

function toTmdbLang(lang) {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

function formatMovie(m) {
  return {
    tmdb_id: m.id,
    title: m.title,
    poster_path: m.poster_path
      ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
      : null,
    release_year: m.release_date ? m.release_date.split('-')[0] : null,
    overview: m.overview || '',
    genres: (m.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean),
  };
}

async function trendingFromRapidApi(country, outputLang) {
  const r = await axios.get('https://streaming-availability.p.rapidapi.com/shows/search/filters', {
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
    },
    params: { country: country.toLowerCase(), show_type: 'movie', order_by: 'popularity_1year', output_language: outputLang },
  });
  return (r.data.shows || []).slice(0, 20).map(show => ({
    tmdb_id: show.tmdbId ? parseInt(String(show.tmdbId).replace('movie/', ''), 10) : null,
    title: show.title,
    poster_path: show.imageSet?.verticalPoster?.w360 || show.imageSet?.verticalPoster?.w240 || null,
    release_year: show.releaseYear ? String(show.releaseYear) : null,
    overview: show.overview || '',
    genres: (show.genres || []).map(g => g.name).filter(Boolean),
  }));
}

async function trendingFromTmdb(country, tmdbLang) {
  const [page1, page2] = await Promise.all([
    axios.get(`${TMDB_BASE}/trending/movie/week`, { params: { api_key: process.env.TMDB_API_KEY, language: tmdbLang, page: 1 } }),
    axios.get(`${TMDB_BASE}/trending/movie/week`, { params: { api_key: process.env.TMDB_API_KEY, language: tmdbLang, page: 2 } }),
  ]);
  const candidates = [...(page1.data.results || []), ...(page2.data.results || [])];
  const withProviders = await Promise.all(
    candidates.map(async m => {
      try {
        const r = await axios.get(`${TMDB_BASE}/movie/${m.id}/watch/providers`, { params: { api_key: process.env.TMDB_API_KEY } });
        const countryData = (r.data.results || {})[country.toUpperCase()];
        if (!countryData) return null;
        const hasSubscription = (countryData.flatrate?.length > 0) || (countryData.free?.length > 0) || (countryData.ads?.length > 0);
        const hasRentBuy = (countryData.rent?.length > 0) || (countryData.buy?.length > 0);
        if (!hasSubscription && !hasRentBuy) return null;
        return { movie: m, hasSubscription };
      } catch { return null; }
    })
  );
  return withProviders
    .filter(Boolean)
    .sort((a, b) => b.hasSubscription - a.hasSubscription)
    .slice(0, 20)
    .map(({ movie }) => formatMovie(movie));
}

router.get('/trending', async (req, res) => {
  const country = req.query.country || 'US';
  const lang = req.query.lang || 'en';
  const tmdbLang = toTmdbLang(lang);
  const outputLang = lang === 'es' ? 'es' : 'en';

  try {
    let movies;
    try {
      movies = await trendingFromRapidApi(country, outputLang);
    } catch {
      movies = await trendingFromTmdb(country, tmdbLang);
    }
    res.json(movies);
  } catch (err) {
    console.error('[trending] error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch trending movies' });
  }
});

router.get('/similar/:tmdbId', async (req, res) => {
  const lang = req.query.lang || 'en';
  const tmdbLang = toTmdbLang(lang);

  try {
    const r = await axios.get(`${TMDB_BASE}/movie/${req.params.tmdbId}/recommendations`, {
      params: { api_key: process.env.TMDB_API_KEY, language: tmdbLang },
    });
    res.json(r.data.results.slice(0, 20).map(formatMovie));
  } catch {
    res.status(502).json({ error: 'Failed to fetch similar movies' });
  }
});

module.exports = router;
