import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { registerDeseret } from '@ingglish/deseret';
import { registerIPA } from '@ingglish/ipa';
import { registerPronunciation } from '@ingglish/phonemes';
import { registerShavian } from '@ingglish/shavian';
import { FormatProvider } from './contexts/FormatContext';
import { registerExperiment } from './hooks/useCustomMapping';
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
