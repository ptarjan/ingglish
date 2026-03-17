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

export async function render(url: string): Promise<string> {
  const handler = createStaticHandler(ssgRoutes);
  const fetchRequest = new Request(`https://ingglish.com${url}`);
  const context = await handler.query(fetchRequest);

  // Redirects return a Response
  if (context instanceof Response) {
    return '';
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  return renderToString(
    <React.StrictMode>
      <FormatProvider>
        <StaticRouterProvider context={context} router={router} />
      </FormatProvider>
    </React.StrictMode>
  );
}
