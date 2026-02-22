import { useEffect, useState } from 'react';

type ThemeMode = 'auto' | 'dark' | 'light';

const VALID_THEME_MODES = new Set<ThemeMode>(['auto', 'dark', 'light']);

export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('themeMode');
      return isValidThemeMode(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });

  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme = themeMode === 'auto' ? getSystemTheme() : themeMode;
      document.documentElement.dataset.theme = effectiveTheme;
    };

    applyTheme();
    try {
      localStorage.setItem('themeMode', themeMode);
    } catch {
      // localStorage unavailable (private browsing)
    }

    const mediaQuery = globalThis.matchMedia('(prefers-color-scheme: dark)');
    if (themeMode === 'auto') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => {
        mediaQuery.removeEventListener('change', applyTheme);
      };
    }
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'auto') {
        return 'light';
      }
      if (prev === 'light') {
        return 'dark';
      }
      return 'auto';
    });
  };

  const getThemeIcon = () => {
    if (themeMode === 'auto') {
      return '🌓';
    }
    if (themeMode === 'light') {
      return '☀️';
    }
    return '🌙';
  };

  return { cycleTheme, getThemeIcon, themeMode };
}

function getSystemTheme(): 'dark' | 'light' {
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function isValidThemeMode(value: null | string): value is ThemeMode {
  return value !== null && VALID_THEME_MODES.has(value as ThemeMode);
}
