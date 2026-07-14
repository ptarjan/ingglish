import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { registerDeseret } from '@ingglish/deseret';
import { registerIPA } from '@ingglish/ipa';
import { registerPronunciation } from '@ingglish/phonemes';
import { registerShavian } from '@ingglish/shavian';
import { FormatProvider } from './contexts/FormatContext';
import { registerExperiment } from './hooks/useCustomMapping';
// Side effect: registers the browser dictionary loader (setDictLoader).
// DictGate needs it on every route — it must load with the main bundle, not
// ride along inside a lazy route chunk.
import './pronounce/dict-loader';
import { registerServiceWorker } from './register-sw';
import { routes } from './routes-config';
import './styles/index.css';

// Explicit calls ensure bundlers cannot tree-shake these registrations
registerDeseret();
registerIPA();
registerPronunciation();
registerShavian();

// Register custom experiment format
registerExperiment();

// Register service worker in production
if (!import.meta.env.DEV) {
  registerServiceWorker();
}

const rootElement = document.querySelector('#root');
if (rootElement === null) {
  throw new Error('Root element not found');
}

const router = createBrowserRouter(routes);

// AppLayout renders its own per-route <meta name="description"> and canonical
// <link> (React 19 hoists them into <head>). With createRoot (no hydration)
// React appends rather than reconciles, so drop the SSG-injected statics first
// or JS-rendering crawlers see two descriptions and two canonicals per page.
for (const tag of document.head.querySelectorAll(
  'meta[name="description"], link[rel="canonical"]'
)) {
  tag.remove();
}

// Always use createRoot (not hydrateRoot). SSG content is for SEO crawlers only —
// the client replaces it entirely. Hydration would require exact HTML parity between
// SSG and client (dict loading state, theme, browser-only APIs) which isn't practical.
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FormatProvider>
      <RouterProvider router={router} />
    </FormatProvider>
  </React.StrictMode>
);
