import { useState, useEffect } from 'react';
import { loadDictionary, getDictionaryStats } from '@ingglish/core';
import TextTranslator from './components/TextTranslator';
import UrlTranslator from './components/UrlTranslator';
import SpellingGuide from './components/SpellingGuide';

type Tab = 'text' | 'url' | 'guide';
type ThemeMode = 'light' | 'dark' | 'auto';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<Tab>('text');
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode');
    return (saved as ThemeMode) || 'auto';
  });

  useEffect(() => {
    const applyTheme = () => {
      const effectiveTheme = themeMode === 'auto' ? getSystemTheme() : themeMode;
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    };

    applyTheme();
    localStorage.setItem('themeMode', themeMode);

    // Listen for OS theme changes when in auto mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (themeMode === 'auto') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'auto') return 'light';
      if (prev === 'light') return 'dark';
      return 'auto';
    });
  };

  const getThemeIcon = () => {
    if (themeMode === 'auto') return '🌓';
    if (themeMode === 'light') return '☀️';
    return '🌙';
  };

  useEffect(() => {
    loadDictionary()
      .then(() => {
        const stats = getDictionaryStats();
        setWordCount(stats.wordCount);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load dictionary: ${message}`);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading dictionary...</p>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="error-screen">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <button className="theme-toggle" onClick={cycleTheme} aria-label="Toggle theme">
        {getThemeIcon()}
      </button>
      <header className="header">
        <div className="header-title">
          <img src="logo.svg" alt="Ingglish logo" className="logo" />
          <h1>Ingglish</h1>
        </div>
        <p className="subtitle">
          <button
            className="subtitle-link"
            onClick={() => {
              setActiveTab('guide');
            }}
          >
            Phonetic English Spelling
          </button>
        </p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('text');
          }}
        >
          Translate Text
        </button>
        <button
          className={`tab ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('url');
          }}
        >
          Translate URL
        </button>
        <button
          className={`tab ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('guide');
          }}
        >
          Spelling Guide
        </button>
      </nav>

      <main className="main">
        {activeTab === 'text' && <TextTranslator />}
        {activeTab === 'url' && <UrlTranslator />}
        {activeTab === 'guide' && <SpellingGuide />}
      </main>

      <footer className="footer">
        <p>
          Ingglish uses the{' '}
          <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noopener noreferrer">
            CMU Pronouncing Dictionary
          </a>{' '}
          ({wordCount.toLocaleString()} words) to convert English words to their phonetic spellings.
        </p>
      </footer>
    </div>
  );
}

export default App;
