export const SITE_THEME_STORAGE_KEY = 'likhle-site-theme';
export const SITE_THEME_DEFAULT = 'dark';

export function getThemeInitScript() {
  return `
    (function () {
      try {
        var storedTheme = window.localStorage.getItem('${SITE_THEME_STORAGE_KEY}');
        var theme = storedTheme === 'light' || storedTheme === 'dark'
          ? storedTheme
          : '${SITE_THEME_DEFAULT}';
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
      } catch (error) {
        document.documentElement.setAttribute('data-theme', '${SITE_THEME_DEFAULT}');
        document.documentElement.style.colorScheme = '${SITE_THEME_DEFAULT}';
      }
    })();
  `;
}
