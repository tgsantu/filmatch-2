import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('filmatch-lang') || 'es');

  useEffect(() => {
    localStorage.setItem('filmatch-lang', lang);
  }, [lang]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
