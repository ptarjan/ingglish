import React from 'react';
import { renderToString } from 'react-dom/server';
import type { RouteObject } from 'react-router';
import { createStaticHandler, createStaticRouter, StaticRouterProvider } from 'react-router';
import AppLayout from './AppLayout';
import { DictGate } from './components/DictGate';
import Docs from './components/Docs';
import ErrorBoundary from './components/ErrorBoundary';
import Extension from './components/Extension';
import TextTranslator from './components/TextTranslator';
import Tutorial from './components/Tutorial';
import { FormatProvider } from './contexts/FormatContext';

// SSG-specific route config: eagerly import dict-independent components (Docs, Extension)
// so they render their full content. Dict-dependent routes render the loading spinner
// since the dictionary isn't available at build time — same as client initial render.
const ssgRoutes: RouteObject[] = [
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
              <TextTranslator />
            </ErrorBoundary>
          </DictGate>
        ),
        path: 'text',
      },
      {
        element: (
          <DictGate>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
          </DictGate>
        ),
        path: 'url',
      },
      {
        element: (
          <DictGate>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
          </DictGate>
        ),
        path: 'guide',
      },
      {
        element: <Extension />,
        path: 'extension',
      },
      {
        element: (
          <DictGate>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
          </DictGate>
        ),
        path: 'explore',
      },
      {
        element: (
          <DictGate>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
          </DictGate>
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
          <DictGate>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
          </DictGate>
        ),
        path: 'games/:gameId?',
      },
      {
        // /challenge redirects to /games/reading on the client; for SSG, render a loading spinner
        element: (
          <DictGate>
            <div className="loading-screen">
              <div className="loading-spinner"></div>
            </div>
          </DictGate>
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
