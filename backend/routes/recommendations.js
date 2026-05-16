const express = require('express');
const axios = require('axios');
const router = express.Router();

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const TMDB_BASE = 'https://api.themoviedb.org/3';

function toTmdbLang(lang) {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

router.post('/', async (req, res) => {
  const { movies, library, lang = 'en' } = req.body;
  if (!movies || movies.length === 0) {
    return res.status(400).json({ error: 'No seen movies provided.' });
  }

  const tmdbLang = toTmdbLang(lang);
  const langInstruction = lang === 'es'
    ? 'Write the "reason" field in Spanish.'
    : 'Write the "reason" field in English.';

  // Most recent 30: full detail (title + year + genres + overview)
  // Older movies: title + genres only — keeps token count bounded while preserving taste signal
  const detailed = movies.slice(0, 30);
  const compact = movies.slice(30);

  const detailedList = detailed.map(m => {
    const genres = Array.isArray(m.genres) ? m.genres : [];
    const overview = m.overview ? ` — "${m.overview}"` : '';
    return `"${m.title}" (${m.release_year || 'N/A'}) [${genres.join(', ') || 'Unknown'}]${overview}`;
  }).join('\n');

  const compactList = compact.length > 0
    ? '\n\nAdditional watched movies (title + genre only):\n' + compact.map(m => {
        const genres = Array.isArray(m.genres) ? m.genres : [];
        return `"${m.title}" [${genres.join(', ') || 'Unknown'}]`;
      }).join('\n')
    : '';

  const movieList = detailedList + compactList;

  const excludeList = Array.isArray(library) && library.length > 0
    ? `\n\nDo NOT recommend any of these movies (already in the user's list):\n${library.map(m => `"${m.title}"`).join(', ')}`
    : '';

  const prompt = `Based on these movies the user has watched:\n${movieList}${excludeList}\n\nRecommend exactly 9 different movies they haven't seen yet and are not in the list above. ${langInstruction} Return ONLY a JSON array with this exact structure, no extra text:\n[\n  {\n    "title": "Movie Title",\n    "year": 2020,\n    "reason": "Short reason why they'd like it based on their taste"\n  }\n]`;

  try {
    const groqRes = await axios.post(GROQ_BASE, {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }, {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    });

    const content = groqRes.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid response format from AI');
    const recs = JSON.parse(jsonMatch[0]);

    const enriched = await Promise.all(recs.map(async rec => {
      try {
        const search = await axios.get(`${TMDB_BASE}/search/movie`, {
          params: { api_key: process.env.TMDB_API_KEY, query: rec.title, language: tmdbLang },
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
