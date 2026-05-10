const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const moviesRouter = require('./routes/movies');
const libraryRouter = require('./routes/library');
const streamingRouter = require('./routes/streaming');
const recommendationsRouter = require('./routes/recommendations');
const quizRouter = require('./routes/quiz');
const settingsRouter = require('./routes/settings');
const homeRouter = require('./routes/home');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/movies', moviesRouter);
app.use('/api/library', libraryRouter);
app.use('/api/streaming', streamingRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/home', homeRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Filmatch backend running on port ${PORT}`);
});
