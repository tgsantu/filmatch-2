const express = require('express');
const axios = require('axios');
const db = require('../database');
const router = express.Router();

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const TMDB_BASE = 'https://api.themoviedb.org/3';

router.get('/', async (req, res) => {
  const seenMovies = db.get('library').filter({ status: 'seen' }).value();

  if (seenMovies.length === 0) {
    return res.status(400).json({ error: 'Add some movies to your "Seen" list first to get recommendations.' });
  }

  const movieList = seenMovies.map(m => {
    const genres = Array.isArray(m.genres) ? m.genres : [];
    return `"${m.title}" (${m.release_year || 'N/A'}) - Genres: ${genres.join(', ') || 'Unknown'}`;
  }).join('\n');

  const prompt = `Based on these movies the user has watched:\n${movieList}\n\nRecommend exactly 6 movies they haven't seen yet. Return ONLY a JSON array with this exact structure, no extra text:\n[\n  {\n    "title": "Movie Title",\n    "year": 2020,\n    "reason": "Short reason why they'd like it based on their taste"\n  }\n]`;

  try {
    const groqRes = await axios.post(GROQ_BASE, {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const content = groqRes.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format from AI');
    const recs = JSON.parse(jsonMatch[0]);

    const enriched = await Promise.all(recs.map(async rec => {
      try {
        const search = await axios.get(`${TMDB_BASE}/search/movie`, {
          params: { api_key: process.env.TMDB_API_KEY, query: rec.title, language: 'en-US' },
        });
        const movie = search.data.results[0];
        if (!movie) return { ...rec, poster_path: null, tmdb_id: null, overview: '' };
        return {
          ...rec,
          tmdb_id: movie.id,
          poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          overview: movie.overview || '',
        };
      } catch {
        return { ...rec, poster_path: null, tmdb_id: null, overview: '' };
      }
    }));

    res.json(enriched);
  } catch (err) {
    res.status(502).json({ error: 'Failed to generate recommendations', detail: err.message });
  }
});

module.exports = router;
