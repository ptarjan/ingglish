import { useCallback, useRef, useEffect, useState } from 'react';
import { useUrlTranslator, normalizeUrl } from '../hooks/useUrlTranslator';
import { useFormat } from '../contexts/FormatContext';

/**
 * Fullscreen icon (expand arrows)
 */
function FullscreenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

/**
 * Exit fullscreen icon (shrink arrows)
 */
function ExitFullscreenIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

const EXAMPLE_URLS = [
  { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/English_language' },
  {
    name: 'US Constitution',
    url: 'https://www.archives.gov/founding-docs/constitution-transcript',
  },
  { name: 'Alice in Wonderland', url: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html' },
  { name: 'Dictionary', url: 'https://www.merriam-webster.com/dictionary/hello' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'NPR', url: 'https://text.npr.org' },
  { name: 'NY Times', url: 'https://www.nytimes.com' },
  { name: 'Reddit', url: 'https://old.reddit.com' },
  { name: 'GitHub', url: 'https://github.com/ptarjan/ingglish' },
];

interface UrlTranslatorProps {
  initialUrl?: string;
  onShare?: (url: string) => void;
  onNavigate?: (url: string) => void;
}

function UrlTranslator({ initialUrl = '', onShare, onNavigate }: UrlTranslatorProps) {
  const { format } = useFormat();
  const { url, setUrl, isLoading, hasContent, error, iframeRef, translateUrl, clear } =
    useUrlTranslator({ onNavigate, outputFormat: format });
  const formRef = useRef<HTMLFormElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

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

      try {
        // translateUrl handles pushState and onNavigate internally
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

  const handleShare = useCallback(() => {
    if (onShare !== undefined && url.trim().length > 0) {
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
            className={`btn-secondary ${copiedShare ? 'btn-copied' : ''}`}
            disabled={url.trim().length === 0}
          >
            {copiedShare ? 'Copied!' : 'Share'}
          </button>
        )}
      </form>

      {error !== null && <div className="error-message">{error}</div>}

      <div
        ref={iframeContainerRef}
        className={`iframe-container ${hasContent || isLoading ? '' : 'iframe-container--empty'} ${isFullscreen ? 'iframe-container--fullscreen' : ''}`}
      >
        {isLoading && (
          <div className="iframe-loading-indicator">
            <div className="loading-spinner" />
          </div>
        )}
        {hasContent && (
          <button
            type="button"
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        )}
        <iframe
          ref={iframeRef}
          title="Translated page"
          sandbox="allow-same-origin allow-scripts"
          className={`page-iframe ${hasContent && !isLoading ? 'page-iframe--ready' : ''}`}
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
