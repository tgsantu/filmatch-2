import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import './Onboarding.css';

const ICONS = ['🎬', '🔍', '📚', '✨', '🎯'];

export default function Onboarding({ onDone }) {
  const { t } = useLanguage();
  const steps = t.onboarding.steps;
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <button className="onboarding-skip" onClick={onDone}>{t.onboarding.skip}</button>

        <div className="onboarding-icon">{ICONS[step]}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.description}</p>
        {current.tip && <p className="onboarding-tip">{current.tip}</p>}

        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === step ? 'active' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>{t.onboarding.back}</button>
          )}
          <button
            className="btn btn-primary onboarding-next"
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          >
            {isLast ? t.onboarding.getStarted : t.onboarding.next}
          </button>
        </div>
      </div>
    </div>
  );
}
