import { useState, useEffect, useCallback } from 'react';
import { translate } from '@ingglish/core';
import TextTranslator from './components/TextTranslator';
import UrlTranslator from './components/UrlTranslator';
import SpellingGuide from './components/SpellingGuide';
import Extension from './components/Extension';
import Docs from './components/Docs';
import { useFormat } from './contexts/FormatContext';

type Tab = 'text' | 'url' | 'guide' | 'extension' | 'docs';
type ThemeMode = 'light' | 'dark' | 'auto';

const VALID_THEME_MODES: ThemeMode[] = ['light', 'dark', 'auto'];

function isValidThemeMode(value: string | null): value is ThemeMode {
  return value !== null && VALID_THEME_MODES.includes(value as ThemeMode);
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getTabFromHash(): Tab {
  const hash = window.location.hash.slice(1);
  if (hash === 'url' || hash === 'guide' || hash === 'extension' || hash === 'docs') {
    return hash;
  }
  return 'text';
}

function getInitialText(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('text') ?? '';
}

function getInitialUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('url') ?? '';
}

function App() {
  const { format, toggleFormat } = useFormat();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromHash);
  const [initialText] = useState(getInitialText);
  const [initialUrl] = useState(getInitialUrl);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('themeMode');
      return isValidThemeMode(saved) ? saved : 'auto';
    } catch {
      return 'auto'; // localStorage unavailable (private browsing)
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

    // Listen for OS theme changes when in auto mode
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

  // Sync tab with URL hash
  useEffect(() => {
    window.location.hash = activeTab === 'text' ? '' : activeTab;
  }, [activeTab]);

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Build shareable URL
  const buildShareUrl = useCallback((targetUrl: string): string => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = 'url';
    url.searchParams.set('url', targetUrl);
    return url.toString();
  }, []);

  // Share functions
  const handleShareText = useCallback((text: string) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('text', text);
    navigator.clipboard.writeText(url.toString()).catch(() => {
      // Fallback: just update URL
    });
    window.history.replaceState(null, '', url.toString());
  }, []);

  const handleShareUrl = useCallback(
    (targetUrl: string) => {
      const shareUrl = buildShareUrl(targetUrl);
      navigator.clipboard.writeText(shareUrl).catch(() => {
        // Fallback: clipboard might not be available
      });
      // Preserve translator state so back button still works after sharing
      window.history.replaceState({ translatorUrl: targetUrl }, '', shareUrl);
    },
    [buildShareUrl]
  );

  // Update browser URL without copying to clipboard (for navigation)
  // Use the translatorUrl state that should have been set by translateUrl's pushState
  const handleUrlNavigate = useCallback(
    (targetUrl: string) => {
      const shareUrl = buildShareUrl(targetUrl);
      // Explicitly set the correct state - don't rely on history.state which may be stale
      window.history.replaceState({ translatorUrl: targetUrl }, '', shareUrl);
    },
    [buildShareUrl]
  );

  useEffect(() => {
    // Preload dictionary by calling translate once
    translate('')
      .then(() => {
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
      <div className="toggle-buttons">
        <button
          className="format-toggle"
          onClick={toggleFormat}
          aria-label="Toggle output format"
          title={format === 'ingglish' ? 'Switch to IPA' : 'Switch to Ingglish'}
        >
          {format === 'ingglish' ? 'Ingglish' : 'IPA'}
        </button>
        <button className="theme-toggle" onClick={cycleTheme} aria-label="Toggle theme">
          {getThemeIcon()}
        </button>
      </div>
      <header className="header">
        <div className="header-title">
          <a className="logo-link" href="https://paultarjan.com/ingglish/">
            <img src="logo.svg" alt="Ingglish logo" className="logo" />
            <h1>Ingglish</h1>
          </a>
          <button
            className="subtitle-link"
            onClick={() => {
              setActiveTab('guide');
            }}
          >
            What if English spelling made sense?
          </button>
        </div>
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
          className={`tab ${activeTab === 'extension' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('extension');
          }}
        >
          Extension
        </button>
        <button
          className={`tab ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('guide');
          }}
        >
          Spelling Guide
        </button>
        <button
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('docs');
          }}
        >
          Docs
        </button>
      </nav>

      <main className="main">
        {activeTab === 'text' && (
          <TextTranslator initialText={initialText} onShare={handleShareText} />
        )}
        {activeTab === 'url' && (
          <UrlTranslator
            initialUrl={initialUrl}
            onShare={handleShareUrl}
            onNavigate={handleUrlNavigate}
          />
        )}
        {activeTab === 'guide' && <SpellingGuide />}
        {activeTab === 'extension' && <Extension />}
        {activeTab === 'docs' && <Docs />}
      </main>

      <footer className="footer">
        <p>
          Ingglish uses the{' '}
          <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noopener noreferrer">
            CMU Pronouncing Dictionary
          </a>{' '}
          (134,000+ words) to convert English words to their phonetic spellings.{' '}
          <a href="https://github.com/ptarjan/ingglish" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
