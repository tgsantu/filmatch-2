const express = require('express');
const axios = require('axios');
const router = express.Router();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const typeLabels = { flatrate: 'Subscription', rent: 'Rent', buy: 'Buy', free: 'Free', ads: 'Free with ads' };

async function fromRapidApi(tmdbId, country) {
  const response = await axios.get(`https://streaming-availability.p.rapidapi.com/shows/movie/${tmdbId}`, {
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
    },
    params: { output_language: 'en' },
  });
  const countryOptions = (response.data.streamingOptions || {})[country.toLowerCase()] || [];
  return countryOptions.map(opt => ({
    service: opt.service?.name || opt.service?.id || 'Unknown',
    type: typeLabels[opt.type] || opt.type,
    link: opt.link,
  }));
}

async function fromTmdb(tmdbId, country) {
  const response = await axios.get(`${TMDB_BASE}/movie/${tmdbId}/watch/providers`, {
    params: { api_key: process.env.TMDB_API_KEY },
  });
  const countryData = (response.data.results || {})[country.toUpperCase()];
  if (!countryData) return [];
  const link = countryData.link || null;
  const platforms = [];
  for (const [type, label] of Object.entries(typeLabels)) {
    for (const p of (countryData[type] || [])) {
      platforms.push({ service: p.provider_name, type: label, link });
    }
  }
  return platforms;
}

router.get('/:tmdbId', async (req, res) => {
  const country = req.query.country || 'AR';

  try {
    let platforms;
    try {
      platforms = await fromRapidApi(req.params.tmdbId, country);
    } catch {
      platforms = await fromTmdb(req.params.tmdbId, country);
    }
    res.json({ tmdb_id: req.params.tmdbId, country: country.toUpperCase(), platforms });
  } catch (err) {
    console.error('[streaming] error:', err.response?.data || err.message);
    if (err.response?.status === 404) {
      return res.json({ tmdb_id: req.params.tmdbId, country: country.toUpperCase(), platforms: [] });
    }
    res.status(502).json({ error: 'Failed to fetch streaming info', detail: err.message });
  }
});

module.exports = router;
