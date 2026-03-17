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

// Use hydrateRoot when SSG content is present (the .app div), createRoot otherwise (dev mode)
if (rootElement.querySelector('.app')) {
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <FormatProvider>
        <RouterProvider router={router} />
      </FormatProvider>
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <FormatProvider>
        <RouterProvider router={router} />
      </FormatProvider>
    </React.StrictMode>
  );
}
