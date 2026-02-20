import { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'auto';

const VALID_THEME_MODES: ThemeMode[] = ['light', 'dark', 'auto'];

function isValidThemeMode(value: string | null): value is ThemeMode {
  return value !== null && VALID_THEME_MODES.includes(value as ThemeMode);
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

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
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    };

    applyTheme();
    try {
      localStorage.setItem('themeMode', themeMode);
    } catch {
      // localStorage unavailable (private browsing)
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
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

  return { themeMode, cycleTheme, getThemeIcon };
}
