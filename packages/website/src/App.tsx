import { translate } from 'ingglish';
import type { ComponentType, LazyExoticComponent } from 'react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { trackPageView } from './analytics';
import ErrorBoundary from './components/ErrorBoundary';
import TextTranslator from './components/TextTranslator';
import Tutorial from './components/Tutorial';
import { useTheme } from './hooks/useTheme';
import { useUpdateCheck } from './hooks/useUpdateCheck';
// Retry dynamic imports with a page reload on failure (handles stale chunks after deploys)
function lazyWithReload<T extends { default: ComponentType<object> }>(
  factory: () => Promise<T>
): LazyExoticComponent<T['default']> {
  return lazy(() =>
    factory().catch(() => {
      // Chunk failed to load (likely stale after deploy) — reload to get fresh HTML
      globalThis.location.reload();
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
const Games = lazyWithReload(() => import('./components/Games'));

type Tab =
  | 'docs'
  | 'experiment'
  | 'explore'
  | 'extension'
  | 'games'
  | 'guide'
  | 'text'
  | 'tutorial'
  | 'url';
const ROUTE_META: Record<Tab, { description: string; path: string; title: string }> = {
  docs: {
    description:
      'Technical documentation for Ingglish — architecture, design decisions, phoneme mappings, and API reference.',
    path: '/docs',
    title: 'Documentation | Ingglish',
  },
  experiment: {
    description:
      'Create custom phoneme-to-spelling mappings and test them with translated text. See statistics and share your mapping.',
    path: '/experiment',
    title: 'Experiment | Ingglish',
  },
  explore: {
    description:
      'Look up any English word to see its phoneme-by-phoneme translation pipeline, IPA transcription, homophones, and frequency data.',
    path: '/explore',
    title: 'Word Explorer | Ingglish',
  },
  extension: {
    description:
      'Install the Ingglish browser extension to translate any webpage to phonetic spelling with one click.',
    path: '/extension',
    title: 'Browser Extension | Ingglish',
  },
  games: {
    description:
      'Practice reading and understanding Ingglish with interactive games. Reading challenge, homophones quiz, and learn-to-read lessons.',
    path: '/games',
    title: 'Games | Ingglish',
  },
  guide: {
    description:
      'Learn the Ingglish spelling rules — how each sound maps to one consistent spelling. A complete reference for the phonemic alphabet.',
    path: '/guide',
    title: 'Spelling Guide | Ingglish',
  },
  text: {
    description:
      'Translate any English text into phonetic Ingglish spelling instantly. Paste or type text and see it respelled.',
    path: '/text',
    title: 'Text Translator | Ingglish',
  },
  tutorial: {
    description:
      'Ingglish is phonemic English — every spelling always makes the same sound. No silent letters, no memorization.',
    path: '/',
    title: 'Ingglish — What if English Spelling Made Sense?',
  },
  url: {
    description:
      'Enter any URL and read the page in phonetic Ingglish spelling. Browse the web with consistent, phonetic English.',
    path: '/url',
    title: 'URL Translator | Ingglish',
  },
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const [activeTab, setActiveTab] = useState<Tab>(getTabFromPath);
  const [resetKey, setResetKey] = useState(0);
  const [initialText] = useState(getInitialText);
  const [initialLang] = useState(getInitialLang);
  const [initialUrl] = useState(getInitialUrl);
  const { cycleTheme, getThemeIcon } = useTheme();
  const updateAvailable = useUpdateCheck();
  const meta = useMemo(() => ROUTE_META[activeTab], [activeTab]);

  // Sync URL path and document title with active tab (docs and games manage their own sub-paths and titles)
  useEffect(() => {
    const targetPath = activeTab === 'tutorial' ? '/' : `/${activeTab}`;
    const currentPath = globalThis.location.pathname.replace(/\/$/, '') || '/';
    if (currentPath !== targetPath && activeTab !== 'docs' && activeTab !== 'games') {
      globalThis.history.pushState(null, '', targetPath);
    }
    if (activeTab !== 'docs' && activeTab !== 'games') {
      document.title = meta.title;
    }
    trackPageView(targetPath);
    window.scrollTo(0, 0);
  }, [activeTab, meta.title]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    globalThis.addEventListener('popstate', handlePopState);
    return () => {
      globalThis.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Build shareable URL
  const buildShareUrl = useCallback((targetUrl: string): string => {
    const url = new URL(globalThis.location.href);
    url.pathname = '/url';
    url.search = '';
    url.hash = '';
    url.searchParams.set('url', targetUrl);
    return url.toString();
  }, []);

  // Share functions — build URL, update history, return URL for the component to share
  const handleShareText = useCallback((text: string, lang?: string): string => {
    const url = new URL(globalThis.location.href);
    url.pathname = '/text';
    url.search = '';
    url.hash = '';
    url.searchParams.set('text', text);
    if (lang) {
      url.searchParams.set('lang', lang);
    }
    const shareUrl = url.toString();
    globalThis.history.replaceState(null, '', shareUrl);
    return shareUrl;
  }, []);

  const handleShareUrl = useCallback(
    (targetUrl: string, lang?: string): string => {
      const shareUrl = buildShareUrl(targetUrl);
      const url = new URL(shareUrl);
      if (lang) {
        url.searchParams.set('lang', lang);
      }
      const finalUrl = url.toString();
      // Preserve translator state so back button still works after sharing
      globalThis.history.replaceState({ translatorUrl: targetUrl }, '', finalUrl);
      return finalUrl;
    },
    [buildShareUrl]
  );

  // Update browser URL without copying to clipboard (for navigation)
  // Use the translatorUrl state that should have been set by translateUrl's pushState
  const handleUrlNavigate = useCallback(
    (targetUrl: string, lang?: string) => {
      const shareUrl = buildShareUrl(targetUrl);
      const parsed = new URL(shareUrl);
      // Preserve existing lang param when not explicitly provided (e.g. hash navigations)
      const effectiveLang = lang ?? new URL(globalThis.location.href).searchParams.get('lang');
      if (effectiveLang) {
        parsed.searchParams.set('lang', effectiveLang);
      }
      // Explicitly set the correct state - don't rely on history.state which may be stale
      globalThis.history.replaceState({ translatorUrl: targetUrl }, '', parsed.toString());
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
      .catch((error_: unknown) => {
        const message = error_ instanceof Error ? error_.message : 'Unknown error';
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

  return (
    <div className="app">
      {updateAvailable && (
        <div className="update-banner">
          A new version is available.{' '}
          <button
            onClick={() => {
              globalThis.location.reload();
            }}
          >
            Reload
          </button>
        </div>
      )}
      <meta content={meta.description} name="description" />
      <link href={`https://ingglish.com${meta.path}`} rel="canonical" />
      <header className="header">
        <div className="header-title">
          <a
            className="logo-link"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (activeTab === 'tutorial') {
                globalThis.history.replaceState(null, '', '/');
                setResetKey((k) => k + 1);
              } else {
                setActiveTab('tutorial');
              }
            }}
          >
            <img alt="Ingglish logo" className="logo" height={56} src="/logo.svg" width={56} />
            <h1>Ingglish</h1>
          </a>
          <button
            className="subtitle-link"
            onClick={() => {
              setActiveTab('guide');
            }}
            style={isLoading ? { visibility: 'hidden' } : undefined}
          >
            What if English spelling made sense?
          </button>
          <div className="toggle-buttons">
            <button aria-label="Toggle theme" className="theme-toggle" onClick={cycleTheme}>
              {getThemeIcon()}
            </button>
          </div>
        </div>
      </header>

      {activeTab !== 'tutorial' && (
        <nav className="tabs" style={isLoading ? { visibility: 'hidden' } : undefined}>
          {(
            [
              ['/', 'tutorial', 'Tutorial'],
              ['/text', 'text', 'Translate Text'],
              ['/url', 'url', 'Translate URL'],
              ['/guide', 'guide', 'Spelling Guide'],
              ['/docs', 'docs', 'Docs'],
              ['/extension', 'extension', 'Extension'],
              ['/explore', 'explore', 'Word Explorer'],
              ['/experiment', 'experiment', 'Experiment'],
              ['/games', 'games', 'Games'],
            ] as const
          ).map(([href, tab, label]) => (
            <a
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              href={href}
              key={tab}
              onClick={(e) => {
                e.preventDefault();
                if (tab === activeTab) {
                  // Re-clicking active tab: clear query params and reset component
                  globalThis.history.replaceState(null, '', href);
                  setResetKey((k) => k + 1);
                } else {
                  setActiveTab(tab);
                }
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
        {/* Tabs that don't need the dictionary render immediately */}
        {(activeTab === 'docs' || activeTab === 'extension') && (
          <Suspense
            fallback={
              <div className="loading-screen">
                <div className="loading-spinner"></div>
              </div>
            }
            key={resetKey}
          >
            {activeTab === 'extension' && <Extension />}
            {activeTab === 'docs' && (
              <ErrorBoundary>
                <Docs />
              </ErrorBoundary>
            )}
          </Suspense>
        )}
        {/* Tabs that need the dictionary wait for it to load */}
        {activeTab !== 'docs' && activeTab !== 'extension' && isLoading && (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
          </div>
        )}
        {activeTab !== 'docs' && activeTab !== 'extension' && !isLoading && error === null && (
          <Suspense
            fallback={
              <div className="loading-screen">
                <div className="loading-spinner"></div>
              </div>
            }
            key={resetKey}
          >
            {activeTab === 'tutorial' && <Tutorial onNavigate={handleTabNavigate} />}
            {activeTab === 'text' && (
              <ErrorBoundary>
                <TextTranslator
                  initialLang={initialLang}
                  initialText={initialText}
                  onShare={handleShareText}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'url' && (
              <ErrorBoundary>
                <UrlTranslator
                  initialLang={initialLang}
                  initialUrl={initialUrl}
                  onNavigate={handleUrlNavigate}
                  onShare={handleShareUrl}
                />
              </ErrorBoundary>
            )}
            {activeTab === 'guide' && <SpellingGuide />}
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
            {activeTab === 'games' && (
              <ErrorBoundary>
                <Games />
              </ErrorBoundary>
            )}
          </Suspense>
        )}
      </main>

      <footer className="footer">
        <p>
          Ingglish uses the{' '}
          <a href="https://github.com/cmusphinx/cmudict" rel="noopener noreferrer" target="_blank">
            CMU Pronouncing Dictionary
          </a>{' '}
          (134,000+ words) to convert English words to their phonemic spellings.{' '}
          <a href="https://github.com/ptarjan/ingglish" rel="noopener noreferrer" target="_blank">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function getInitialLang(): string | undefined {
  const params = new URLSearchParams(globalThis.location.search);
  return params.get('lang') ?? undefined;
}

function getInitialText(): string {
  const params = new URLSearchParams(globalThis.location.search);
  return params.get('text') ?? '';
}

function getInitialUrl(): string {
  const params = new URLSearchParams(globalThis.location.search);
  return params.get('url') ?? '';
}

function getTabFromPath(): Tab {
  const path = globalThis.location.pathname.replace(/\/$/, '') || '/';
  const segment = path.split('/')[1] ?? '';
  if (segment === 'docs') {
    return 'docs';
  }
  if (segment === 'games' || segment === 'challenge') {
    return 'games';
  }
  if (
    segment === 'tutorial' ||
    segment === 'text' ||
    segment === 'url' ||
    segment === 'guide' ||
    segment === 'extension' ||
    segment === 'experiment' ||
    segment === 'explore'
  ) {
    return segment;
  }
  return 'tutorial';
}

export default App;
