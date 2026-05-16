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

router.get('/trending', async (req, res) => {
  const country = (req.query.country || 'us').toLowerCase();
  const lang = req.query.lang || 'en';
  const outputLang = lang === 'es' ? 'es' : 'en';

  try {
    const r = await axios.get('https://streaming-availability.p.rapidapi.com/shows/search/filters', {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
      },
      params: {
        country,
        show_type: 'movie',
        order_by: 'popularity_1year',
        output_language: outputLang,
      },
    });

    const shows = (r.data.shows || []).slice(0, 20);
    const movies = shows.map(show => ({
      tmdb_id: show.tmdbId ? parseInt(String(show.tmdbId).replace('movie/', ''), 10) : null,
      title: show.title,
      poster_path: show.imageSet?.verticalPoster?.w360
        || show.imageSet?.verticalPoster?.w240
        || null,
      release_year: show.releaseYear ? String(show.releaseYear) : null,
      overview: show.overview || '',
      genres: (show.genres || []).map(g => g.name).filter(Boolean),
    }));

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
