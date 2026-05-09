# Filmatch

A full-stack movie tracker with AI-powered recommendations, streaming availability, and a discovery quiz.

## Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3) — all data stored locally
- **Movie data**: TMDB API
- **Streaming info**: Streaming Availability API (RapidAPI / Movie of the Night)
- **AI features**: Groq API (LLaMA 3.3 70B)

## API Keys Required

| Service | Where to get it |
|---|---|
| **TMDB** | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) — free account required |
| **Streaming Availability** | [rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability](https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability) — free tier available |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) — free account |

## Setup

1. **Clone the repo** and navigate to the root folder.

2. **Create the `.env` file** in the project root:
   ```
   TMDB_API_KEY=your_tmdb_key_here
   RAPIDAPI_KEY=your_rapidapi_key_here
   GROQ_API_KEY=your_groq_key_here
   PORT=5000
   ```

3. **Install dependencies**:
   ```bash
   # Install backend dependencies
   npm install --prefix backend

   # Install frontend dependencies
   npm install --prefix frontend
   ```

4. **Start the backend** (Terminal 1):
   ```bash
   npm run dev:backend
   # or: cd backend && npm run dev
   ```

5. **Start the frontend** (Terminal 2):
   ```bash
   npm run start:frontend
   # or: cd frontend && npm start
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Search
Search any movie by title. Results show poster, year, and genre. Click a card to expand and see synopsis, streaming availability, and add-to-library buttons.

### Library
Your personal tracked movie list. Filter by "Seen" or "Watchlist". Click a card to see streaming availability. Toggle status or remove movies at any time.

### For You (AI Recommendations)
Based on your "Seen" list, the Groq AI generates 6 personalized recommendations. Each card shows the poster, synopsis, why you'd like it, and where to stream it.

### Discover (Quiz)
A 10-question multiple-choice quiz covering mood, genre, decade, pacing, themes, and language. Submit to get 6 AI-tailored movie picks.

### Settings
Configure your streaming country (defaults to Argentina). Affects streaming availability shown throughout the app.

## Project Structure

```
filmatch-2/
├── .env                     # API keys (never commit this)
├── package.json             # Root scripts
├── backend/
│   ├── server.js            # Express app entry point
│   ├── database.js          # SQLite setup
│   └── routes/
│       ├── movies.js        # TMDB search & details
│       ├── library.js       # User's movie library CRUD
│       ├── streaming.js     # Streaming availability lookup
│       ├── recommendations.js # Groq AI recommendations
│       ├── quiz.js          # Quiz questions + Groq AI results
│       └── settings.js      # User settings (country)
└── frontend/
    └── src/
        ├── App.js           # Root component + navigation
        └── components/
            ├── Search.js
            ├── Library.js
            ├── Recommendations.js
            ├── RecommendationCard.js
            ├── Quiz.js
            ├── Settings.js
            └── MovieCard.js
```
