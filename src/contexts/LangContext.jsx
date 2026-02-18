import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'shg-lang';
const DEFAULT_LANG = 'ta';

const LangContext = createContext(DEFAULT_LANG);

function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ta') return stored;
  } catch {
    // Ignore storage read errors.
  }
  return DEFAULT_LANG;
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getStoredLang);

  const setLang = (newLang) => {
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {
      // Ignore storage write errors.
    }
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (typeof ctx === 'string') return ctx;
  return ctx.lang;
}

export function useLangContext() {
  return useContext(LangContext);
}

export default LangContext;
