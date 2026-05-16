const express = require('express');
const axios = require('axios');
const db = require('../database');
const router = express.Router();

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const SEED_QUESTIONS = {
  es: [
    {
      question: '¿Cuál es tu estado de ánimo ahora mismo?',
      options: ['Quiero reír', 'Necesito algo intenso', 'Quiero pasar miedo', 'Quiero inspirarme'],
    },
    {
      question: '¿Qué género te está pidiendo el cuerpo esta noche?',
      options: ['Acción / Thriller', 'Drama / Romance', 'Ciencia Ficción / Fantasía', 'Terror / Misterio'],
    },
  ],
  en: [
    {
      question: "What's your mood right now?",
      options: ['I want to laugh', 'I need something intense', 'I want to be scared', 'I want to feel inspired'],
    },
    {
      question: 'Which genre are you feeling tonight?',
      options: ['Action / Thriller', 'Drama / Romance', 'Sci-Fi / Fantasy', 'Horror / Mystery'],
    },
  ],
};

function toTmdbLang(lang) {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

router.get('/seed', (req, res) => {
  const lang = req.query.lang || 'en';
  res.json(SEED_QUESTIONS[lang] || SEED_QUESTIONS.en);
});

router.post('/next', async (req, res) => {
  const { history = [], lang = 'en' } = req.body;
  const tmdbLang = toTmdbLang(lang);

  const langInstruction = lang === 'es'
    ? 'Generate questions and options in Spanish. Write the "reason" field in Spanish.'
    : 'Generate questions and options in English. Write the "reason" field in English.';

  const historyText = history
    .map((h, i) => `Q${i + 1}: ${h.question}\nA: ${h.answer}`)
    .join('\n\n');

  const forceRecs = history.length >= 7;

  const prompt = `You are running an adaptive movie recommendation quiz. Your goal is to understand the user's taste through targeted multiple-choice questions, then recommend great movies.

Rules:
- Each question must have EXACTLY 4 short, distinct options (max 6 words each)
- Questions should drill progressively deeper into the user's specific taste
- Never repeat a topic already covered in the conversation
- After 5–7 questions when you have enough context, switch to recommendations
- ${langInstruction}

Conversation so far:
${historyText || 'No answers yet.'}

${forceRecs ? 'You now have enough context. Provide movie recommendations.' : 'Generate the next most insightful question, OR provide recommendations if you have sufficient context (5+ answers).'}

Return ONLY valid JSON in exactly one of these two formats:

Format 1 — next question:
{
  "question": "Short specific question?",
  "options": ["Option A", "Option B", "Option C", "Option D"]
}

Format 2 — final recommendations (exactly 6 movies):
{
  "done": true,
  "recommendations": [
    { "title": "Movie Title", "year": 2020, "reason": "One sentence reason" }
  ]
}`;

  try {
    const geminiRes = await axios.post(
      `${GEMINI_BASE}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 700 },
      }
    );

    const content = geminiRes.data.candidates[0].content.parts[0].text.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.done && parsed.recommendations) {
      const enriched = await Promise.all(parsed.recommendations.slice(0, 6).map(async rec => {
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

      db.get('quiz_history').push({ history, recommendations: enriched, created_at: new Date().toISOString() }).write();
      return res.json({ done: true, recommendations: enriched });
    }

    if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
      return res.json({ question: parsed.question, options: parsed.options });
    }

    throw new Error('Unexpected response structure');
  } catch (err) {
    res.status(502).json({ error: 'Failed to generate next question', detail: err.message });
  }
});

module.exports = router;
