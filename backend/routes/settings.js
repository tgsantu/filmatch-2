const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.get('settings').value());
});

router.put('/', (req, res) => {
  const { country } = req.body;
  if (country) {
    db.set('settings.country', country.toUpperCase()).write();
  }
  res.json(db.get('settings').value());
});

module.exports = router;
