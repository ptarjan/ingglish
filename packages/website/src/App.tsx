import type { ComponentType, LazyExoticComponent } from 'react';
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { translate } from 'ingglish';
import TextTranslator from './components/TextTranslator';
import Tutorial from './components/Tutorial';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import { trackPageView } from './utils/analytics';
import { useUpdateCheck } from './hooks/useUpdateCheck';
// Retry dynamic imports with a page reload on failure (handles stale chunks after deploys)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithReload<T extends { default: ComponentType<any> }>(
  factory: () => Promise<T>
): LazyExoticComponent<T['default']> {
  return lazy(() =>
    factory().catch(() => {
      // Chunk failed to load (likely stale after deploy) — reload to get fresh HTML
      window.location.reload();
      // Never resolves — page is reloading
      return new Promise<T>(() => void 0);
    })
  );
}

const UrlTranslator = lazyWithReload(() => import('./components/UrlTranslator'));
const SpellingGuide = lazyWithReload(() => import('./components/SpellingGuide'));
const Extension = lazyWithReload(() => import('./components/Extension'));
const Docs = lazyWithReload(() => import('./components/Docs'));
const Experiment = lazyWithReload(() => import('./components/Experiment'));
const WordExplorer = lazyWithReload(() => import('./components/WordExplorer'));
const ReadingChallenge = lazyWithReload(() => import('./components/ReadingChallenge'));

type Tab =
  | 'tutorial'
  | 'text'
  | 'url'
  | 'guide'
  | 'extension'
  | 'docs'
  | 'experiment'
  | 'explore'
  | 'challenge';
const ROUTE_META: Record<Tab, { title: string; description: string; path: string }> = {
  tutorial: {
    title: 'Ingglish — What if English Spelling Made Sense?',
    description:
      'Ingglish is phonemic English — every spelling always makes the same sound. No silent letters, no memorization.',
    path: '/',
  },
  text: {
    title: 'Text Translator | Ingglish',
    description:
      'Translate any English text into phonetic Ingglish spelling instantly. Paste or type text and see it respelled.',
    path: '/text',
  },
  url: {
    title: 'URL Translator | Ingglish',
    description:
      'Enter any URL and read the page in phonetic Ingglish spelling. Browse the web with consistent, phonetic English.',
    path: '/url',
  },
  guide: {
    title: 'Spelling Guide | Ingglish',
    description:
      'Learn the Ingglish spelling rules — how each sound maps to one consistent spelling. A complete reference for the phonemic alphabet.',
    path: '/guide',
  },
  extension: {
    title: 'Browser Extension | Ingglish',
    description:
      'Install the Ingglish browser extension to translate any webpage to phonetic spelling with one click.',
    path: '/extension',
  },
  docs: {
    title: 'Documentation | Ingglish',
    description:
      'Technical documentation for Ingglish — architecture, design decisions, phoneme mappings, and API reference.',
    path: '/docs',
  },
  experiment: {
    title: 'Experiment | Ingglish',
    description:
      'Create custom phoneme-to-spelling mappings and test them with translated text. See statistics and share your mapping.',
    path: '/experiment',
  },
  explore: {
    title: 'Word Explorer | Ingglish',
    description:
      'Look up any English word to see its phoneme-by-phoneme translation pipeline, IPA transcription, homophones, and frequency data.',
    path: '/explore',
  },
  challenge: {
    title: 'Reading Challenge | Ingglish',
    description:
      'Test how quickly you can read Ingglish! 10 rounds of progressively harder sentences with shareable results.',
    path: '/challenge',
  },
};

function getTabFromPath(): Tab {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const segment = path.split('/')[1] ?? '';
  if (segment === 'docs') {
    return 'docs';
  }
  if (
    segment === 'tutorial' ||
    segment === 'text' ||
    segment === 'url' ||
    segment === 'guide' ||
    segment === 'extension' ||
    segment === 'experiment' ||
    segment === 'explore' ||
    segment === 'challenge'
  ) {
    return segment;
  }
  return 'tutorial';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromPath);
  const [initialText] = useState(getInitialText);
  const [initialUrl] = useState(getInitialUrl);
  const { cycleTheme, getThemeIcon } = useTheme();
  const updateAvailable = useUpdateCheck();

  // Sync URL path with active tab (docs manages its own sub-path)
  useEffect(() => {
    const targetPath = activeTab === 'tutorial' ? '/' : `/${activeTab}`;
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== targetPath && activeTab !== 'docs') {
      // Preserve existing query string (e.g. ?word=hello on /explore)
      const url = new URL(window.location.href);
      url.pathname = targetPath;
      window.history.pushState(null, '', url.pathname + url.search);
    }
    trackPageView(targetPath);
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Build shareable URL
  const buildShareUrl = useCallback((targetUrl: string): string => {
    const url = new URL(window.location.href);
    url.pathname = '/url';
    url.search = '';
    url.hash = '';
    url.searchParams.set('url', targetUrl);
    return url.toString();
  }, []);

  // Share functions — build URL, update history, return URL for the component to share
  const handleShareText = useCallback((text: string): string => {
    const url = new URL(window.location.href);
    url.pathname = '/text';
    url.search = '';
    url.hash = '';
    url.searchParams.set('text', text);
    const shareUrl = url.toString();
    window.history.replaceState(null, '', shareUrl);
    return shareUrl;
  }, []);

  const handleShareUrl = useCallback(
    (targetUrl: string): string => {
      const shareUrl = buildShareUrl(targetUrl);
      // Preserve translator state so back button still works after sharing
      window.history.replaceState({ translatorUrl: targetUrl }, '', shareUrl);
      return shareUrl;
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

  const handleTabNavigate = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
  }, []);

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

  // Flip tooltips below the word when near the top of the viewport
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.('[data-orig]');
      if (!target) {
        return;
      }
      const rect = target.getBoundingClientRect();
      target.classList.toggle('tooltip-below', rect.top < 35);
    };
    document.addEventListener('mouseover', handler, true);
    return () => {
      document.removeEventListener('mouseover', handler, true);
    };
  }, []);

  const meta = useMemo(() => ROUTE_META[activeTab], [activeTab]);

  return (
    <div className="app">
      {updateAvailable && (
        <div className="update-banner">
          A new version is available.{' '}
          <button
            onClick={() => {
              window.location.reload();
            }}
          >
            Reload
          </button>
        </div>
      )}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={`https://ingglish.com${meta.path}`} />
      <div className="toggle-buttons">
        <button className="theme-toggle" onClick={cycleTheme} aria-label="Toggle theme">
          {getThemeIcon()}
        </button>
      </div>
      <header className="header">
        <div className="header-title">
          <a
            className="logo-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('tutorial');
            }}
          >
            <img src="/logo.svg" alt="Ingglish logo" className="logo" />
            <h1>Ingglish</h1>
          </a>
          <button
            className="subtitle-link"
            style={isLoading ? { visibility: 'hidden' } : undefined}
            onClick={() => {
              setActiveTab('guide');
            }}
          >
            What if English spelling made sense?
          </button>
        </div>
      </header>

      {activeTab !== 'tutorial' && !isLoading && (
        <nav className="tabs">
          {(
            [
              ['/', 'tutorial', 'Tutorial'],
              ['/text', 'text', 'Translate Text'],
              ['/url', 'url', 'Translate URL'],
              ['/extension', 'extension', 'Extension'],
              ['/guide', 'guide', 'Spelling Guide'],
              ['/docs', 'docs', 'Docs'],
              ['/explore', 'explore', 'Word Explorer'],
              ['/experiment', 'experiment', 'Experiment'],
              ['/challenge', 'challenge', 'Challenge'],
            ] as const
          ).map(([href, tab, label]) => (
            <a
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      )}

      <main className="main">
        {error !== null && (
          <div className="error-screen">
            <h1>Error</h1>
            <p>{error}</p>
          </div>
        )}
        {isLoading && (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
          </div>
        )}
        {!isLoading && error === null && (
          <>
            {activeTab === 'tutorial' && <Tutorial onNavigate={handleTabNavigate} />}
            {activeTab === 'text' && (
              <ErrorBoundary>
                <TextTranslator initialText={initialText} onShare={handleShareText} />
              </ErrorBoundary>
            )}
            <Suspense
              fallback={
                <div className="loading-screen">
                  <div className="loading-spinner"></div>
                </div>
              }
            >
              {activeTab === 'url' && (
                <ErrorBoundary>
                  <UrlTranslator
                    initialUrl={initialUrl}
                    onShare={handleShareUrl}
                    onNavigate={handleUrlNavigate}
                  />
                </ErrorBoundary>
              )}
              {activeTab === 'guide' && <SpellingGuide />}
              {activeTab === 'extension' && <Extension />}
              {activeTab === 'explore' && (
                <ErrorBoundary>
                  <WordExplorer />
                </ErrorBoundary>
              )}
              {activeTab === 'experiment' && (
                <ErrorBoundary>
                  <Experiment />
                </ErrorBoundary>
              )}
              {activeTab === 'challenge' && (
                <ErrorBoundary>
                  <ReadingChallenge />
                </ErrorBoundary>
              )}
              {activeTab === 'docs' && (
                <ErrorBoundary>
                  <Docs />
                </ErrorBoundary>
              )}
            </Suspense>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Ingglish uses the{' '}
          <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noopener noreferrer">
            CMU Pronouncing Dictionary
          </a>{' '}
          (134,000+ words) to convert English words to their phonemic spellings.{' '}
          <a href="https://github.com/ptarjan/ingglish" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
