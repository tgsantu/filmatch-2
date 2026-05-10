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

router.get('/trending', async (req, res) => {
  try {
    const r = await axios.get(`${TMDB_BASE}/trending/movie/week`, {
      params: { api_key: process.env.TMDB_API_KEY, language: 'en-US' },
    });
    res.json(r.data.results.slice(0, 20).map(formatMovie));
  } catch {
    res.status(502).json({ error: 'Failed to fetch trending movies' });
  }
});

router.get('/similar/:tmdbId', async (req, res) => {
  try {
    const r = await axios.get(`${TMDB_BASE}/movie/${req.params.tmdbId}/recommendations`, {
      params: { api_key: process.env.TMDB_API_KEY, language: 'en-US' },
    });
    res.json(r.data.results.slice(0, 20).map(formatMovie));
  } catch {
    res.status(502).json({ error: 'Failed to fetch similar movies' });
  }
});

module.exports = router;
