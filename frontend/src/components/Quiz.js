import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RecommendationCard from './RecommendationCard';
import './Quiz.css';

export default function Quiz() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState('intro'); // intro | quiz | loading | results
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    axios.get('/api/quiz/questions')
      .then(res => setQuestions(res.data))
      .catch(() => setError('Failed to load quiz questions.'));
  }, []);

  const handleAnswer = (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    if (currentQ < questions.length - 1) {
      setTimeout(() => setCurrentQ(q => q + 1), 300);
    }
  };

  const submit = async () => {
    setStep('loading');
    setError('');
    try {
      const res = await axios.post('/api/quiz/submit', { answers });
      setResults(res.data);
      setStep('results');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get recommendations.');
      setStep('quiz');
    }
  };

  const restart = () => {
    setAnswers({});
    setCurrentQ(0);
    setResults([]);
    setError('');
    setStep('intro');
  };

  if (step === 'intro') {
    return (
      <div>
        <h1 className="section-title">Discover</h1>
        <div className="quiz-intro">
          <div className="quiz-intro-icon">🎯</div>
          <h2>Find your perfect movie</h2>
          <p>Answer {questions.length} quick questions and our AI will find movies tailored to your exact mood and taste right now.</p>
          <div className="quiz-features">
            <span>Mood</span><span>Genre</span><span>Decade</span><span>Themes</span><span>Language</span>
          </div>
          <button className="btn btn-primary quiz-start-btn" onClick={() => setStep('quiz')} disabled={questions.length === 0}>
            Start Quiz →
          </button>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div>
        <h1 className="section-title">Discover</h1>
        <div className="loading" style={{ flexDirection: 'column', gap: '1rem', padding: '6rem' }}>
          <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p>Finding your perfect movies...</p>
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
        <p className="section-subtitle">Based on your quiz answers, here are your personalized recommendations</p>
        {results.length > 0 && (
          <div className="grid">
            {results.map((movie, i) => (
              <RecommendationCard key={i} movie={movie} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // quiz step
  const q = questions[currentQ];
  const progress = ((currentQ) / questions.length) * 100;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;

  return (
    <div>
      <div className="quiz-topbar">
        <h1 className="section-title" style={{ margin: 0 }}>Discover</h1>
        <button className="btn btn-ghost" onClick={restart} style={{ fontSize: '0.8rem' }}>✕ Exit</button>
      </div>

      <div className="quiz-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-text">{answered}/{questions.length} answered</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {q && (
        <div className="question-card">
          <p className="question-num">Question {currentQ + 1} of {questions.length}</p>
          <h2 className="question-text">{q.question}</h2>
          <div className="options-grid">
            {q.options.map((opt, i) => (
              <button
                key={i}
                className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => handleAnswer(q.id, opt)}
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="quiz-nav">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
          disabled={currentQ === 0}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {currentQ < questions.length - 1 && (
            <button
              className="btn btn-ghost"
              onClick={() => setCurrentQ(q => q + 1)}
            >
              Skip →
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!allAnswered}
            title={!allAnswered ? `Answer all ${questions.length} questions to submit` : ''}
          >
            {allAnswered ? 'Get My Movies ✨' : `${answered}/${questions.length} answered`}
          </button>
        </div>
      </div>
    </div>
  );
}
