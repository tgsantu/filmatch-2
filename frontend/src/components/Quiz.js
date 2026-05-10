import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecommendationCard from './RecommendationCard';
import './Quiz.css';

export default function Quiz({ onAdd, country }) {
  const [step, setStep] = useState('intro');
  const [seeds, setSeeds] = useState([]);
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState(null);
  const [seedIndex, setSeedIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    axios.get('/api/quiz/seed')
      .then(res => setSeeds(res.data))
      .catch(() => setError('Failed to load quiz.'));
  }, []);

  const start = () => {
    if (seeds.length === 0) return;
    setCurrent(seeds[0]);
    setSeedIndex(0);
    setHistory([]);
    setStep('quiz');
    setError('');
  };

  const restart = () => {
    setHistory([]);
    setSeedIndex(0);
    setCurrent(null);
    setResults([]);
    setError('');
    setStep('intro');
  };

  const handleAnswer = async (answer) => {
    const newEntry = { question: current.question, answer };
    const newHistory = [...history, newEntry];
    setHistory(newHistory);

    const nextSeedIndex = seedIndex + 1;
    if (nextSeedIndex < seeds.length) {
      setSeedIndex(nextSeedIndex);
      setCurrent(seeds[nextSeedIndex]);
      return;
    }

    setLoadingNext(true);
    setCurrent(null);
    setError('');

    try {
      const res = await axios.post('/api/quiz/next', { history: newHistory });
      if (res.data.done) {
        setResults(res.data.recommendations);
        setStep('results');
      } else {
        setCurrent(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
    } finally {
      setLoadingNext(false);
    }
  };

  if (step === 'intro') {
    return (
      <div>
        <h1 className="section-title">Discover</h1>
        <div className="quiz-intro">
          <div className="quiz-intro-icon">🎯</div>
          <h2>Find your perfect movie</h2>
          <p>Answer a few questions and our AI adapts each one to your taste — no two quizzes are alike.</p>
          <div className="quiz-features">
            <span>Adaptive</span><span>AI-powered</span><span>Personalized</span>
          </div>
          {error && <p className="quiz-error">{error}</p>}
          <button className="btn btn-primary quiz-start-btn" onClick={start} disabled={seeds.length === 0}>
            Start Quiz →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div>
        <div className="results-header">
          <h1 className="section-title">Your Picks</h1>
          <button className="btn btn-ghost" onClick={restart}>Take Again</button>
        </div>
        <p className="section-subtitle">Based on your {history.length} answers — tailored just for you</p>
        <div className="grid">
          {results.map((movie, i) => (
            <RecommendationCard key={i} movie={movie} onAdd={onAdd} country={country} />
          ))}
        </div>
      </div>
    );
  }

  const questionNum = history.length + 1;

  return (
    <div>
      <div className="quiz-topbar">
        <h1 className="section-title" style={{ margin: 0 }}>Discover</h1>
        <button className="btn btn-ghost" onClick={restart} style={{ fontSize: '0.8rem' }}>✕ Exit</button>
      </div>

      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill adaptive" />
        </div>
        <span className="progress-text">{history.length} answered</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loadingNext && (
        <div className="quiz-loading">
          <div className="quiz-loading-dots">
            <span /><span /><span />
          </div>
          <p>Thinking of the next question...</p>
        </div>
      )}

      {!loadingNext && current && (
        <div className="question-card" key={current.question}>
          <p className="question-num">Question {questionNum}</p>
          <h2 className="question-text">{current.question}</h2>
          <div className="options-grid">
            {current.options.map((opt, i) => (
              <button
                key={i}
                className="option-btn"
                onClick={() => handleAnswer(opt)}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
