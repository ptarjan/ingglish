import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { FormatProvider } from './contexts/FormatContext';
import './styles/index.css';

const rootElement = document.getElementById('root');
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
