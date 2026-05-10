import React, { useState } from 'react';
import './Onboarding.css';

const STEPS = [
  {
    icon: '🎬',
    title: 'Welcome to theFilMatch',
    description: 'Your personal movie tracker with AI-powered recommendations. Here\'s a quick tour to get you started.',
    tip: null,
  },
  {
    icon: '🔍',
    title: 'Search any movie',
    description: 'Use the Search tab to find any movie. Click a card to expand it and see the synopsis, streaming platforms, and add it to your list.',
    tip: 'Tip: streaming availability is based on your country setting.',
  },
  {
    icon: '📚',
    title: 'Build your Library',
    description: 'Mark movies as Seen or add them to your Watchlist. Your library syncs to your account so it\'s available on any device.',
    tip: 'Tip: click a card in your library to toggle its status or see where to watch it.',
  },
  {
    icon: '✨',
    title: 'Get AI recommendations',
    description: 'Once you\'ve marked a few movies as Seen, go to the For You tab. Our AI reads your taste and suggests movies you\'ll love.',
    tip: 'Tip: the more movies you mark as Seen, the better the recommendations.',
  },
  {
    icon: '🎯',
    title: 'Discover with the quiz',
    description: 'Head to the Discover tab and answer 10 quick questions about your mood, preferred genre, decade, and more — then get tailored AI picks for tonight.',
    tip: null,
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-skip" onClick={onDone}>Skip</button>

        <div className="onboarding-icon">{current.icon}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.description}</p>
        {current.tip && <p className="onboarding-tip">{current.tip}</p>}

        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === step ? 'active' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <button
            className="btn btn-primary onboarding-next"
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          >
            {isLast ? 'Get started →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
