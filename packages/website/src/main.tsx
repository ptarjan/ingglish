import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerDeseret } from '@ingglish/deseret';
import { registerIPA } from '@ingglish/ipa';
import { registerPronunciation } from '@ingglish/phonemes';
import { registerShavian } from '@ingglish/shavian';
import App from './App';
import { FormatProvider } from './contexts/FormatContext';
import { registerExperiment } from './hooks/useCustomMapping';
import './styles/index.css';

// Register format plugins
registerPronunciation();
registerIPA();
registerShavian();
registerDeseret();
registerExperiment();

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
