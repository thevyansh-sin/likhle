'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SITE_THEME_DEFAULT, SITE_THEME_STORAGE_KEY } from '../lib/theme';

const SiteThemeContext = createContext({
  ready: false,
  theme: SITE_THEME_DEFAULT,
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function SiteThemeProvider({ children }) {
  const [theme, setTheme] = useState(SITE_THEME_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedTheme = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);

      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
        applyTheme(storedTheme);
      } else {
        applyTheme(SITE_THEME_DEFAULT);
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
    applyTheme(theme);
  }, [ready, theme]);

  const value = useMemo(
    () => ({
      ready,
      theme,
      setTheme,
      toggleTheme: () => {
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
      },
    }),
    [ready, theme]
  );

  return (
    <SiteThemeContext.Provider value={value}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  return useContext(SiteThemeContext);
}
