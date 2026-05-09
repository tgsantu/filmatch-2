const express = require('express');
const axios = require('axios');
const db = require('../database');
const router = express.Router();

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const QUESTIONS = [
  { id: 1, question: "What's your mood today?", options: ['I want to laugh', 'I need to cry', 'I want to be scared', 'I want to be inspired'] },
  { id: 2, question: 'Which genre appeals most to you right now?', options: ['Action / Thriller', 'Drama / Romance', 'Sci-Fi / Fantasy', 'Horror / Mystery'] },
  { id: 3, question: 'What decade do you prefer?', options: ['1970s–1980s classics', '1990s gems', '2000s blockbusters', 'Recent (2010s–now)'] },
  { id: 4, question: 'How do you like your movies paced?', options: ['Fast-paced and intense', 'Slow-burn and thoughtful', 'Balanced', "Doesn't matter"] },
  { id: 5, question: "Pick a theme you're drawn to:", options: ['Redemption & second chances', 'Love & relationships', 'Survival & resilience', 'Identity & self-discovery'] },
  { id: 6, question: 'What language preference do you have?', options: ['English only', 'Open to subtitles', 'Prefer non-English films', 'No preference'] },
  { id: 7, question: 'How complex should the plot be?', options: ['Simple and fun', 'Moderately complex', 'Mind-bending twists', 'No preference'] },
  { id: 8, question: 'What kind of ending do you prefer?', options: ['Happy ending', 'Bittersweet / realistic', 'Open-ended', 'Dark / tragic'] },
  { id: 9, question: 'Who should be at the center of the story?', options: ['A single hero', 'An ensemble cast', 'An antihero', 'No preference'] },
  { id: 10, question: 'How important is cinematography / visual style?', options: ['Very important — I love artistic films', 'Somewhat important', 'Not important — story is everything', 'No preference'] },
];

router.get('/questions', (req, res) => {
  res.json(QUESTIONS);
});

router.post('/submit', async (req, res) => {
  const { answers } = req.body;
  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Answers object required' });
  }

  const answerText = QUESTIONS.map(q => `Q: ${q.question}\nA: ${answers[q.id] || 'No answer'}`).join('\n\n');
  const prompt = `A user answered this movie discovery quiz:\n\n${answerText}\n\nBased on these answers, recommend exactly 6 movies. Return ONLY a JSON array with no extra text:\n[\n  {\n    "title": "Movie Title",\n    "year": 2020,\n    "reason": "Why this matches their preferences"\n  }\n]`;

  try {
    const groqRes = await axios.post(GROQ_BASE, {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000,
    }, {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    });

    const content = groqRes.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Invalid AI response format');
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

    db.get('quiz_history').push({ answers, recommendations: enriched, created_at: new Date().toISOString() }).write();
    res.json(enriched);
  } catch (err) {
    res.status(502).json({ error: 'Failed to generate quiz recommendations', detail: err.message });
  }
});

module.exports = router;
