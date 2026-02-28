import React from 'react';
import ReactDOM from 'react-dom/client';
import '@ingglish/deseret'; // registers 'deseret' format
import '@ingglish/ipa'; // registers 'ipa' format
import '@ingglish/shavian'; // registers 'shavian' format
import App from './App';
import { FormatProvider } from './contexts/FormatContext';
import { registerExperiment } from './hooks/useCustomMapping';
import './styles/index.css';

// Register custom experiment format
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
