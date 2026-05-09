const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  let items = db.get('library').value();
  if (status) items = items.filter(m => m.status === status);
  items = items.slice().sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
  res.json(items);
});

router.post('/', (req, res) => {
  const { tmdb_id, title, poster_path, release_year, genres, overview, status } = req.body;
  if (!tmdb_id || !title || !status) {
    return res.status(400).json({ error: 'tmdb_id, title, and status are required' });
  }
  if (!['seen', 'want_to_watch'].includes(status)) {
    return res.status(400).json({ error: 'status must be "seen" or "want_to_watch"' });
  }

  const existing = db.get('library').find({ tmdb_id }).value();
  if (existing) {
    db.get('library').find({ tmdb_id }).assign({ status }).write();
  } else {
    db.get('library').push({
      id: Date.now(),
      tmdb_id,
      title,
      poster_path: poster_path || null,
      release_year: release_year || null,
      genres: genres || [],
      overview: overview || '',
      status,
      added_at: new Date().toISOString(),
    }).write();
  }

  const item = db.get('library').find({ tmdb_id }).value();
  res.status(201).json(item);
});

router.delete('/:tmdbId', (req, res) => {
  const tmdb_id = parseInt(req.params.tmdbId, 10) || req.params.tmdbId;
  db.get('library').remove({ tmdb_id }).write();
  res.json({ success: true });
});

router.patch('/:tmdbId', (req, res) => {
  const { status } = req.body;
  if (!['seen', 'want_to_watch'].includes(status)) {
    return res.status(400).json({ error: 'status must be "seen" or "want_to_watch"' });
  }
  const tmdb_id = parseInt(req.params.tmdbId, 10) || req.params.tmdbId;
  const item = db.get('library').find({ tmdb_id }).value();
  if (!item) return res.status(404).json({ error: 'Movie not found in library' });
  db.get('library').find({ tmdb_id }).assign({ status }).write();
  res.json(db.get('library').find({ tmdb_id }).value());
});

module.exports = router;
