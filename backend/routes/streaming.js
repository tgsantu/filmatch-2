const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/:tmdbId', async (req, res) => {
  const country = (req.query.country || 'AR').toLowerCase();

  try {
    const response = await axios.get(`https://streaming-availability.p.rapidapi.com/shows/movie/${req.params.tmdbId}`, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
      },
      params: { output_language: 'en' },
    });

    const streamingOptions = response.data.streamingOptions || {};
    const countryOptions = streamingOptions[country] || [];

    const platforms = countryOptions.map(opt => ({
      service: opt.service?.name || opt.service?.id || 'Unknown',
      type: opt.type,
      link: opt.link,
    }));

    res.json({ tmdb_id: req.params.tmdbId, country: country.toUpperCase(), platforms });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.json({ tmdb_id: req.params.tmdbId, country: country.toUpperCase(), platforms: [] });
    }
    console.error('[streaming] error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to fetch streaming info', detail: err.message });
  }
});

module.exports = router;
