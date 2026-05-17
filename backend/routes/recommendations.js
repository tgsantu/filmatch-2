const express = require('express');
const axios = require('axios');
const router = express.Router();

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';
const TMDB_BASE = 'https://api.themoviedb.org/3';

function toTmdbLang(lang) {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

// Words too generic to identify a franchise
const GENERIC_WORDS = new Set([
  'world', 'night', 'story', 'black', 'white', 'blood', 'super', 'under',
  'first', 'other', 'every', 'never', 'still', 'great', 'comes', 'being',
  'years', 'today', 'along', 'those', 'which', 'found', 'three', 'place',
  'might', 'while', 'right', 'begin', 'until', 'later', 'going', 'since',
  'final', 'force', 'power', 'heart', 'light', 'quest', 'order', 'about',
  'death', 'after', 'again', 'kings', 'queen', 'house', 'earth', 'falls',
  'risen', 'parts', 'inner', 'outer', 'above', 'below', 'young', 'older',
  'night', 'hours', 'days', 'weeks', 'years', 'lives', 'souls', 'ghost',
]);

function sagaWords(title) {
  return new Set(
    title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 5 && !GENERIC_WORDS.has(w))
  );
}

function sharesSaga(title1, title2) {
  const words1 = sagaWords(title1);
  for (const w of sagaWords(title2)) {
    if (words1.has(w)) return true;
  }
  return false;
}

// Pick up to `count` movies randomly, replacing franchise duplicates with other movies
function selectDiverseMovies(movies, count = 30) {
  const shuffled = [...movies].sort(() => Math.random() - 0.5);
  const selected = [];

  for (const movie of shuffled) {
    if (selected.length >= count) break;
    if (!selected.some(s => sharesSaga(s.title, movie.title))) {
      selected.push(movie);
    }
  }

  // Fill remaining slots if the library is small or all from the same franchise
  for (const movie of shuffled) {
    if (selected.length >= count) break;
    if (!selected.some(s => s.tmdb_id === movie.tmdb_id)) selected.push(movie);
  }

  return selected;
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

  // 30 franchise-diverse random movies: full detail + director + cast
  // Remaining movies: title + genre only (still informs AI of breadth)
  const detailed = selectDiverseMovies(movies, 30);
  const detailedIds = new Set(detailed.map(m => m.tmdb_id).filter(Boolean));
  const compact = movies.filter(m => !detailedIds.has(m.tmdb_id));

  // Fetch TMDB credits for the 30 detailed movies in parallel
  const creditsResults = await Promise.all(
    detailed.map(m => m.tmdb_id
      ? axios.get(`${TMDB_BASE}/movie/${m.tmdb_id}/credits`, {
          params: { api_key: process.env.TMDB_API_KEY },
        })
          .then(r => r.data)
          .catch(() => null)
      : Promise.resolve(null)
    )
  );

  const detailedList = detailed.map((m, i) => {
    const genres = Array.isArray(m.genres) ? m.genres : [];
    const overview = m.overview ? ` — "${m.overview}"` : '';
    const credits = creditsResults[i];
    let creditsStr = '';
    if (credits) {
      const directors = credits.crew
        .filter(c => c.job === 'Director')
        .map(c => c.name)
        .join(', ');
      const cast = credits.cast.slice(0, 4).map(c => c.name).join(', ');
      if (directors) creditsStr += ` — Director: ${directors}`;
      if (cast) creditsStr += ` — Cast: ${cast}`;
    }
    return `"${m.title}" (${m.release_year || 'N/A'}) [${genres.join(', ') || 'Unknown'}]${overview}${creditsStr}`;
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

  const angles = [
    'Focus on hidden gems and underrated films — avoid the most obvious mainstream picks.',
    'Focus on films from the last 5 years — recent releases the user probably hasn\'t discovered yet.',
    'Focus on cult classics and films with a devoted following.',
    'Focus on films from the 1970s, 1980s or 1990s — older gems they might have missed.',
    'Focus on critically acclaimed films that flew under the radar commercially.',
    'Focus on films from directors or actors similar to those in their watched list.',
    'Focus on a mix of different genres — push the user outside their usual comfort zone.',
    'Focus on films with an unexpected twist or unique narrative structure.',
    'Focus on smaller, independent productions rather than big studio films.',
  ];
  const angle = angles[Math.floor(Math.random() * angles.length)];

  const prompt = `Based on these movies the user has watched:\n${movieList}${excludeList}\n\nRecommend exactly 9 different movies they haven't seen yet and are not in the list above.\n\nAngle for this session: ${angle}\n\n${langInstruction} Return ONLY a JSON array with this exact structure, no extra text:\n[\n  {\n    "title": "Movie Title",\n    "year": 2020,\n    "reason": "Short reason why they'd like it based on their taste"\n  }\n]`;

  const geminiPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 1000, thinkingConfig: { thinkingBudget: 0 } },
  };
  const callGemini = () => axios.post(`${GEMINI_BASE}?key=${process.env.GEMINI_API_KEY}`, geminiPayload);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  try {
    let geminiRes;
    try {
      geminiRes = await callGemini();
    } catch (e) {
      if (e.response?.status === 429) {
        await sleep(4000);
        try {
          geminiRes = await callGemini();
        } catch (e2) {
          if (e2.response?.status === 429) {
            return res.status(503).json({ error: 'high_demand' });
          }
          throw e2;
        }
      } else throw e;
    }

    const parts = geminiRes.data.candidates[0].content.parts;
    const content = (parts.find(p => !p.thought) || parts[parts.length - 1]).text.trim();
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
    console.error('[recommendations] error:', err.response?.data || err.message);
    res.status(502).json({ error: 'Failed to generate recommendations', detail: err.message });
  }
});

module.exports = router;
