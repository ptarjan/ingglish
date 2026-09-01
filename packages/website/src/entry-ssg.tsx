import React from 'react';
import { renderToString } from 'react-dom/server';
import type { RouteObject } from 'react-router';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import AppLayout from './AppLayout';
import Docs from './components/Docs';
import ErrorBoundary from './components/ErrorBoundary';
import Extension from './components/Extension';
import SpellingGuide from './components/SpellingGuide';
import { FormatProvider } from './contexts/FormatContext';

// Noscript fallback for dict-dependent pages (spinner hidden by noscript CSS in index.html)
const dictFallback = (
  <noscript
    dangerouslySetInnerHTML={{
      __html:
        '<p style="color:var(--color-text-muted,#64748b);padding:2rem;text-align:center">This page requires JavaScript for interactive features.</p>',
    }}
  />
);

// SSG-specific route config: eagerly import dict-independent components (Docs, Extension, SpellingGuide)
// so they render their full content. Dict-dependent routes render a noscript fallback
// since the dictionary isn't available at build time.
const ssgRoutes: RouteObject[] = [
  {
    children: [
      {
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        index: true,
      },
      {
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        path: 'text',
      },
      {
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        path: 'url',
      },
      {
        element: <SpellingGuide />,
        path: 'guide',
      },
      {
        element: <Extension />,
        path: 'extension',
      },
      {
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        path: 'explore',
      },
      {
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        path: 'experiment',
      },
      {
        element: (
          <ErrorBoundary>
            <Docs />
          </ErrorBoundary>
        ),
        path: 'docs/:docId?',
      },
      {
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        path: 'games/:gameId?',
      },
      {
        // /challenge redirects to /games/reading on the client; for SSG, render a loading spinner
        element: (
          <>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
            {dictFallback}
          </>
        ),
        path: 'challenge',
      },
    ],
    element: <AppLayout />,
  },
];

// AppLayout and Docs render <meta name="description"> and <link rel="canonical">
// into the tree because React 19 hoists them into <head> in the browser.
// renderToString does not hoist, so on the server they stay where they were
// rendered — inside #root — and the page ends up with two or three conflicting
// descriptions, none of them in <head>. The <head> copies written by
// customizeHtml in vite.config.ts are the only ones that count, so drop these.
// React writes attributes in its own order, so match on the identifying
// attribute rather than on the start of the tag.
const HEAD_ONLY_TAGS = /<meta [^>]*name="description"[^>]*>|<link [^>]*rel="canonical"[^>]*>/g;

export async function render(url: string): Promise<string> {
  const handler = createStaticHandler(ssgRoutes);
  const fetchRequest = new Request(`https://ingglish.com${url}`);
  const context = await handler.query(fetchRequest);

  // Redirects return a Response
  if (context instanceof Response) {
    return '';
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <React.StrictMode>
      <FormatProvider>
        <StaticRouterProvider context={context} router={router} />
      </FormatProvider>
    </React.StrictMode>
  );
  return html.replaceAll(HEAD_ONLY_TAGS, '');
}
