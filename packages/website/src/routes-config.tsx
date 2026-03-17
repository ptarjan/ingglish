import type { ComponentType, LazyExoticComponent } from 'react';
import { lazy, Suspense, useCallback, useState } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';
import AppLayout from './AppLayout';
import { DictGate } from './components/DictGate';
import ErrorBoundary from './components/ErrorBoundary';
import TextTranslator from './components/TextTranslator';
import Tutorial from './components/Tutorial';

// Retry dynamic imports with a page reload on failure (handles stale chunks after deploys)
function lazyWithReload<T extends { default: ComponentType<object> }>(
  factory: () => Promise<T>
): LazyExoticComponent<T['default']> {
  return lazy(() =>
    factory().catch(() => {
      globalThis.location.reload();
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

const loading = (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
  </div>
);

/** Build a shareable URL for the URL translator. */
function buildShareUrl(targetUrl: string): string {
  const url = new URL(globalThis.location.href);
  url.pathname = '/url';
  url.search = '';
  url.hash = '';
  url.searchParams.set('url', targetUrl);
  return url.toString();
}

function getInitialLang(): string | undefined {
  return new URLSearchParams(globalThis.location.search).get('lang') ?? undefined;
}

/** Read initial values from URL search params (evaluated once). */
function getInitialText(): string {
  return new URLSearchParams(globalThis.location.search).get('text') ?? '';
}

function getInitialUrl(): string {
  return new URLSearchParams(globalThis.location.search).get('url') ?? '';
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={loading}>{children}</Suspense>;
}

/** Wrapper that provides share/navigate callbacks for TextTranslator. */
function TextTranslatorRoute() {
  const [initialText] = useState(getInitialText);
  const [initialLang] = useState(getInitialLang);

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

  return (
    <TextTranslator initialLang={initialLang} initialText={initialText} onShare={handleShareText} />
  );
}

/** Wrapper that provides share/navigate callbacks for UrlTranslator. */
function UrlTranslatorRoute() {
  const [initialUrl] = useState(getInitialUrl);
  const [initialLang] = useState(getInitialLang);

  const handleShareUrl = useCallback((targetUrl: string, lang?: string): string => {
    const shareUrl = buildShareUrl(targetUrl);
    const url = new URL(shareUrl);
    if (lang) {
      url.searchParams.set('lang', lang);
    }
    const finalUrl = url.toString();
    globalThis.history.replaceState({ translatorUrl: targetUrl }, '', finalUrl);
    return finalUrl;
  }, []);

  const handleUrlNavigate = useCallback((targetUrl: string, lang?: string) => {
    const shareUrl = buildShareUrl(targetUrl);
    const parsed = new URL(shareUrl);
    const effectiveLang = lang ?? new URL(globalThis.location.href).searchParams.get('lang');
    if (effectiveLang) {
      parsed.searchParams.set('lang', effectiveLang);
    }
    globalThis.history.replaceState({ translatorUrl: targetUrl }, '', parsed.toString());
  }, []);

  return (
    <UrlTranslator
      initialLang={initialLang}
      initialUrl={initialUrl}
      onNavigate={handleUrlNavigate}
      onShare={handleShareUrl}
    />
  );
}

export const routes: RouteObject[] = [
  {
    children: [
      {
        element: (
          <DictGate>
            <Tutorial />
          </DictGate>
        ),
        index: true,
      },
      {
        element: (
          <DictGate>
            <ErrorBoundary>
              <TextTranslatorRoute />
            </ErrorBoundary>
          </DictGate>
        ),
        path: 'text',
      },
      {
        element: (
          <SuspenseWrap>
            <DictGate>
              <ErrorBoundary>
                <UrlTranslatorRoute />
              </ErrorBoundary>
            </DictGate>
          </SuspenseWrap>
        ),
        path: 'url',
      },
      {
        element: (
          <SuspenseWrap>
            <SpellingGuide />
          </SuspenseWrap>
        ),
        path: 'guide',
      },
      {
        element: (
          <SuspenseWrap>
            <Extension />
          </SuspenseWrap>
        ),
        path: 'extension',
      },
      {
        element: (
          <SuspenseWrap>
            <DictGate>
              <ErrorBoundary>
                <WordExplorer />
              </ErrorBoundary>
            </DictGate>
          </SuspenseWrap>
        ),
        path: 'explore',
      },
      {
        element: (
          <SuspenseWrap>
            <DictGate>
              <ErrorBoundary>
                <Experiment />
              </ErrorBoundary>
            </DictGate>
          </SuspenseWrap>
        ),
        path: 'experiment',
      },
      {
        element: (
          <SuspenseWrap>
            <ErrorBoundary>
              <Docs />
            </ErrorBoundary>
          </SuspenseWrap>
        ),
        path: 'docs/:docId?',
      },
      {
        element: (
          <SuspenseWrap>
            <DictGate>
              <ErrorBoundary>
                <Games />
              </ErrorBoundary>
            </DictGate>
          </SuspenseWrap>
        ),
        path: 'games/:gameId?',
      },
      {
        element: <Navigate replace to="/games/reading" />,
        path: 'challenge',
      },
    ],
    element: <AppLayout />,
  },
];
