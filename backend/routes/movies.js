const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';

let genreMap = {};
let genreMapLoaded = false;

async function loadGenres() {
  if (genreMapLoaded) return;
  try {
    const res = await axios.get(`${TMDB_BASE}/genre/movie/list`, {
      params: { api_key: process.env.TMDB_API_KEY, language: 'en-US' },
    });
    res.data.genres.forEach(g => { genreMap[g.id] = g.name; });
    genreMapLoaded = true;
  } catch {}
}

router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter required' });

  try {
    await loadGenres();
    const response = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: { api_key: process.env.TMDB_API_KEY, query, language: 'en-US', page: 1 },
    });
    res.json(response.data.results.map(m => formatMovie(m)));
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch from TMDB', detail: err.message });
  }
});

router.get('/:tmdbId', async (req, res) => {
  try {
    await loadGenres();
    const response = await axios.get(`${TMDB_BASE}/movie/${req.params.tmdbId}`, {
      params: { api_key: process.env.TMDB_API_KEY, language: 'en-US' },
    });
    res.json(formatMovie(response.data));
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch movie details', detail: err.message });
  }
});

function formatMovie(m) {
  let genres = [];
  if (m.genres && Array.isArray(m.genres)) {
    genres = m.genres.map(g => (typeof g === 'object' ? g.name : genreMap[g] || String(g)));
  } else if (m.genre_ids && Array.isArray(m.genre_ids)) {
    genres = m.genre_ids.map(id => genreMap[id] || String(id));
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
