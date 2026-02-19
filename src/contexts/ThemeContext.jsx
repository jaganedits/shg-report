import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'shg-theme';
const DEFAULT_THEME = 'light';

const ThemeContext = createContext(DEFAULT_THEME);

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Ignore storage read errors.
  }
  return DEFAULT_THEME;
}

function applyTheme(theme) {
  const cl = document.documentElement.classList;
  if (theme === 'dark') cl.add('dark');
  else cl.remove('dark');
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const t = getStoredTheme();
    applyTheme(t);
    return t;
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try { localStorage.setItem(STORAGE_KEY, newTheme); } catch {
      // Ignore storage write errors.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (typeof ctx === 'string') return ctx;
  return ctx.theme;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}

export default ThemeContext;
