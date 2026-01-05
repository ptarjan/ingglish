import { useCallback, useRef } from 'react';
import { useUrlTranslator, normalizeUrl } from '../hooks/useUrlTranslator';

const EXAMPLE_URLS = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/English_language' },
  { name: 'US Constitution', url: 'https://www.archives.gov/founding-docs/constitution-transcript' },
  { name: 'BBC', url: 'https://bbc.com' },
  { name: 'CNN', url: 'https://cnn.com' },
];

function UrlTranslator() {
  const { url, setUrl, isLoading, error, iframeRef, translateUrl, clear } = useUrlTranslator();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const normalized = normalizeUrl(url);
      if (!normalized) {
        return;
      }

      try {
        await translateUrl(normalized);
      } catch {
        // Error handling is done in the hook
      }
    },
    [url, translateUrl]
  );

  const handleExampleClick = useCallback(
    (exampleUrl: string) => {
      setUrl(exampleUrl);
      setTimeout(() => formRef.current?.requestSubmit(), 0);
    },
    [setUrl]
  );

  return (
    <div className="url-translator">
      <form ref={formRef} onSubmit={handleSubmit} className="url-form">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL (e.g., example.com)"
          className="url-input"
        />
        <button
          type="submit"
          className={`btn-primary ${isLoading ? 'btn-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Translate'}
        </button>
        <button type="button" onClick={clear} className="btn-secondary">
          Clear
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="iframe-container">
        <iframe
          ref={iframeRef}
          title="Translated page"
          sandbox="allow-same-origin"
          className="page-iframe"
        />
      </div>

      <div className="example-urls">
        <span className="example-label">Try an example:</span>
        {EXAMPLE_URLS.map((example) => (
          <button
            key={example.url}
            type="button"
            className="example-link"
            onClick={() => handleExampleClick(example.url)}
            disabled={isLoading}
          >
            {example.name}
          </button>
        ))}
      </div>

      <p className="url-note">
        Due to browser security restrictions, some websites may not load correctly.
      </p>
    </div>
  );
}

export default UrlTranslator;
