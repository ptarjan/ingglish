import { useCallback, useRef, useEffect, useState } from 'react';
import { useUrlTranslator, normalizeUrl } from '../hooks/useUrlTranslator';

const EXAMPLE_URLS = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/English_language' },
  {
    name: 'US Constitution',
    url: 'https://www.archives.gov/founding-docs/constitution-transcript',
  },
  { name: 'Alice in Wonderland', url: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'NPR', url: 'https://text.npr.org' },
  { name: 'BBC', url: 'https://bbc.com' },
  { name: 'CNN', url: 'https://cnn.com' },
  { name: 'Reddit', url: 'https://old.reddit.com' },
];

interface UrlTranslatorProps {
  initialUrl?: string;
  onShare?: (url: string) => void;
  onNavigate?: (url: string) => void;
}

function UrlTranslator({ initialUrl = '', onShare, onNavigate }: UrlTranslatorProps) {
  const { url, setUrl, isLoading, hasContent, error, iframeRef, translateUrl, clear } =
    useUrlTranslator({ onNavigate });
  const formRef = useRef<HTMLFormElement>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  // Auto-translate if initialUrl is provided
  useEffect(() => {
    if (initialUrl.length > 0) {
      const normalized = normalizeUrl(initialUrl);
      if (normalized !== null) {
        setUrl(normalized);
        translateUrl(normalized).catch(() => {
          // Error handled in hook
        });
      }
    }
  }, [initialUrl, setUrl, translateUrl]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const normalized = normalizeUrl(url);
      if (normalized === null) {
        return;
      }

      onNavigate?.(normalized);

      try {
        await translateUrl(normalized);
      } catch {
        // Error handling is done in the hook
      }
    },
    [url, translateUrl, onNavigate]
  );

  const handleExampleClick = useCallback(
    (exampleUrl: string) => {
      setUrl(exampleUrl);
      setTimeout(() => formRef.current?.requestSubmit(), 0);
    },
    [setUrl]
  );

  const handleShare = useCallback(() => {
    if (onShare && url.trim()) {
      onShare(url);
      setCopiedShare(true);
      setTimeout(() => {
        setCopiedShare(false);
      }, 1500);
    }
  }, [onShare, url]);

  return (
    <div className="url-translator">
      <form ref={formRef} onSubmit={handleSubmit} className="url-form">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
          }}
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
        {onShare && (
          <button
            type="button"
            onClick={handleShare}
            className="btn-secondary"
            disabled={!hasContent}
          >
            {copiedShare ? 'Copied!' : 'Share'}
          </button>
        )}
      </form>

      {error !== null && <div className="error-message">{error}</div>}

      <div className={`iframe-container ${hasContent ? '' : 'iframe-container--empty'}`}>
        {isLoading && hasContent && (
          <div className="iframe-loading-overlay">
            <div className="loading-spinner" />
          </div>
        )}
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
            onClick={() => {
              handleExampleClick(example.url);
            }}
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
