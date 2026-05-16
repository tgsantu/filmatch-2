const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';

router.get('/:tmdbId', async (req, res) => {
  const country = (req.query.country || 'AR').toUpperCase();

  try {
    const response = await axios.get(`${TMDB_BASE}/movie/${req.params.tmdbId}/watch/providers`, {
      params: { api_key: process.env.TMDB_API_KEY },
    });

    const countryData = (response.data.results || {})[country];
    if (!countryData) {
      return res.json({ tmdb_id: req.params.tmdbId, country, platforms: [] });
    }

    const link = countryData.link || null;
    const platforms = [];

    for (const [type, providers] of Object.entries({ flatrate: 'flatrate', rent: 'rent', buy: 'buy', free: 'free', ads: 'ads' })) {
      for (const p of (countryData[type] || [])) {
        platforms.push({ service: p.provider_name, type: providers, link });
      }
    }

    res.json({ tmdb_id: req.params.tmdbId, country, platforms });
  } catch (err) {
    console.error('[streaming] error:', err.response?.data || err.message);
    if (err.response?.status === 404) {
      return res.json({ tmdb_id: req.params.tmdbId, country, platforms: [] });
    }
    res.status(502).json({ error: 'Failed to fetch streaming info', detail: err.message });
  }
});

module.exports = router;
