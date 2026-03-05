import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerDeseret } from '@ingglish/deseret';
import { registerIPA } from '@ingglish/ipa';
import { registerPronunciation } from '@ingglish/phonemes';
import { registerShavian } from '@ingglish/shavian';
import App from './App';
import { FormatProvider } from './contexts/FormatContext';
import { registerExperiment } from './hooks/useCustomMapping';
import { registerServiceWorker } from './register-sw';
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

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FormatProvider>
      <App />
    </FormatProvider>
  </React.StrictMode>
);
