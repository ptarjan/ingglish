import { useState, useEffect } from 'react';
import { loadDictionary, getDictionaryStats } from '@inglish/core';
import TextTranslator from './components/TextTranslator';
import UrlTranslator from './components/UrlTranslator';

type Tab = 'text' | 'url';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<Tab>('text');

  useEffect(() => {
    loadDictionary()
      .then(() => {
        const stats = getDictionaryStats();
        setWordCount(stats.wordCount);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load dictionary: ${err.message}`);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading dictionary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Inglish</h1>
        <p className="subtitle">Phonetic English Spelling</p>
        <p className="stats">{wordCount.toLocaleString()} words in dictionary</p>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          Translate Text
        </button>
        <button
          className={`tab ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          Translate URL
        </button>
      </nav>

      <main className="main">
        {activeTab === 'text' ? <TextTranslator /> : <UrlTranslator />}
      </main>

      <footer className="footer">
        <p>
          Inglish uses the{' '}
          <a
            href="https://github.com/cmusphinx/cmudict"
            target="_blank"
            rel="noopener noreferrer"
          >
            CMU Pronouncing Dictionary
          </a>{' '}
          to convert English words to their phonetic spellings.
        </p>
      </footer>
    </div>
  );
}

export default App;
