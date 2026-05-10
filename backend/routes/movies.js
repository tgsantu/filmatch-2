const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';

const genreMaps = {};

async function loadGenres(tmdbLang) {
  if (genreMaps[tmdbLang]) return;
  genreMaps[tmdbLang] = {};
  try {
    const res = await axios.get(`${TMDB_BASE}/genre/movie/list`, {
      params: { api_key: process.env.TMDB_API_KEY, language: tmdbLang },
    });
    res.data.genres.forEach(g => { genreMaps[tmdbLang][g.id] = g.name; });
  } catch {}
}

function toTmdbLang(lang) {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

router.get('/search', async (req, res) => {
  const { query, lang = 'en' } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter required' });
  const tmdbLang = toTmdbLang(lang);

  try {
    await loadGenres(tmdbLang);
    const response = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: { api_key: process.env.TMDB_API_KEY, query, language: tmdbLang, page: 1 },
    });
    res.json(response.data.results.map(m => formatMovie(m, genreMaps[tmdbLang])));
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch from TMDB', detail: err.message });
  }
});

router.get('/:tmdbId', async (req, res) => {
  const { lang = 'en' } = req.query;
  const tmdbLang = toTmdbLang(lang);

  try {
    await loadGenres(tmdbLang);
    const response = await axios.get(`${TMDB_BASE}/movie/${req.params.tmdbId}`, {
      params: { api_key: process.env.TMDB_API_KEY, language: tmdbLang },
    });
    res.json(formatMovie(response.data, genreMaps[tmdbLang]));
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch movie details', detail: err.message });
  }
});

function formatMovie(m, map = {}) {
  let genres = [];
  if (m.genres && Array.isArray(m.genres)) {
    genres = m.genres.map(g => (typeof g === 'object' ? g.name : map[g] || String(g)));
  } else if (m.genre_ids && Array.isArray(m.genre_ids)) {
    genres = m.genre_ids.map(id => map[id] || String(id));
  }
  return {
    tmdb_id: m.id,
    title: m.title,
    poster_path: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    release_year: m.release_date ? parseInt(m.release_date.slice(0, 4)) : null,
    genres,
    overview: m.overview || '',
  };
}

module.exports = router;
