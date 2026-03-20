'use client';

import { useSiteTheme } from './site-theme-provider';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useSiteTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
