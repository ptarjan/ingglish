import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { getFormatLabel } from '@ingglish/phonemes';
import { trackShare, trackUrlTranslate } from '../analytics';
import { useFormat } from '../contexts/FormatContext';
import { ALL_SAMPLES } from '../data/language-samples';
import { useShare } from '../hooks/useShare';
import { normalizeUrl, useUrlTranslator } from '../hooks/useUrlTranslator';
import { LANGUAGES } from '../pronounce/dict-loader';
import { ExitFullscreenIcon, FullscreenIcon } from './Icons';

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
  initialLang?: string;
  initialUrl?: string;
  onNavigate?: (url: string) => void;
  onShare?: (url: string, lang?: string) => string;
}

function UrlTranslator({ initialLang, initialUrl = '', onNavigate, onShare }: UrlTranslatorProps) {
  const { format, toggleFormat } = useFormat();
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => initialLang ?? localStorage.getItem('ingglish-url-lang') ?? 'en'
  );
  const { clear, dictLoading, error, hasContent, iframeRef, isLoading, setUrl, translateUrl, url } =
    useUrlTranslator({ onNavigate, outputFormat: format, selectedLanguage });
  const formRef = useRef<HTMLFormElement>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const [copiedShare, shareLink] = useShare();
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

  // Auto-translate if initialUrl is provided (e.g. /url?url=... from share link
  // or "Read full page" link). Don't push history — the URL is already in the
  // address bar, so pushing would require an extra back-click to leave.
  useEffect(() => {
    if (initialUrl.length > 0) {
      const normalized = normalizeUrl(initialUrl);
      if (normalized !== null) {
        setUrl(normalized);
        translateUrl(normalized, false).catch(() => {
          // Error handled in hook
        });
      }
    }
  }, [initialUrl, setUrl, translateUrl]);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();

      const normalized = normalizeUrl(url);
      if (normalized === null) {
        return;
      }

      trackUrlTranslate(normalized);
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

  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelectedLanguage(lang);
    localStorage.setItem('ingglish-url-lang', lang);
  }, []);

  const handleShare = useCallback(() => {
    if (onShare !== undefined && url.trim().length > 0) {
      const lang = selectedLanguage === 'en' ? undefined : selectedLanguage;
      const shareUrl = onShare(url, lang);
      shareLink(shareUrl, 'Ingglish URL Translation');
      trackShare('url', typeof navigator.share === 'function' ? 'webshare' : 'clipboard');
    }
  }, [onShare, url, shareLink, selectedLanguage]);

  // For foreign languages, show samples that have source URLs as example links.
  // For English, use the curated EXAMPLE_URLS (familiar site names).
  // De-duplicate by URL to avoid React key collisions (some languages have
  // multiple samples from the same source).
  const exampleUrls = useMemo(() => {
    if (selectedLanguage === 'en') {
      return EXAMPLE_URLS;
    }
    const samples = ALL_SAMPLES[selectedLanguage];
    if (!samples) {
      return EXAMPLE_URLS;
    }
    const seen = new Set<string>();
    const fromSamples: { name: string; url: string }[] = [];
    for (const s of samples) {
      if (s.source && !seen.has(s.source)) {
        seen.add(s.source);
        fromSamples.push({ name: s.label, url: s.source });
      }
    }
    return fromSamples.length > 0 ? fromSamples : EXAMPLE_URLS;
  }, [selectedLanguage]);

  const formatLabel = getFormatLabel(format);

  return (
    <div className="url-translator">
      <form className="url-form" onSubmit={handleSubmit} ref={formRef}>
        <select
          className="language-select"
          onChange={handleLanguageChange}
          value={selectedLanguage}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <input
          className="url-input"
          onChange={(e) => {
            setUrl(e.target.value);
          }}
          placeholder="Enter a URL (e.g., example.com)"
          type="text"
          value={url}
        />
        <button
          className={`btn-primary ${isLoading ? 'btn-loading' : ''}`}
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? 'Loading...' : 'Translate'}
        </button>
        <button
          className="btn-secondary format-toggle"
          disabled={isLoading}
          onClick={toggleFormat}
          type="button"
        >
          {formatLabel} &#x21C5;
        </button>
        <button className="btn-secondary" disabled={isLoading} onClick={clear} type="button">
          Clear
        </button>
        {onShare && (
          <button
            className={`btn-secondary ${copiedShare ? 'btn-copied' : ''}`}
            disabled={isLoading || url.trim().length === 0}
            onClick={handleShare}
            type="button"
          >
            {copiedShare ? 'Copied!' : 'Share'}
          </button>
        )}
      </form>

      {dictLoading && (
        <div className="error-message" style={{ color: 'var(--color-text-secondary)' }}>
          Loading dictionary...
        </div>
      )}
      {error !== null && <div className="error-message">{error}</div>}

      <div
        className={`iframe-container ${hasContent || isLoading ? '' : 'iframe-container--empty'} ${isFullscreen ? 'iframe-container--fullscreen' : ''}`}
        ref={iframeContainerRef}
      >
        {isLoading && (
          <div className="iframe-loading-indicator">
            <div className="loading-spinner" />
          </div>
        )}
        {hasContent && (
          <button
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            type="button"
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        )}
        {/* allow-same-origin: parent needs contentDocument access for translation.
            allow-scripts: required for iOS Safari — parent-attached event listeners
            don't fire on sandboxed iframe documents on iOS. Our click handler script
            must run inside the iframe. DOMPurify strips all page scripts first, and
            a CSP nonce ensures only our click handler can execute. */}
        <iframe
          className={`page-iframe ${hasContent && !isLoading ? 'page-iframe--ready' : ''}`}
          ref={iframeRef}
          sandbox="allow-same-origin allow-scripts"
          title="Translated page"
        />
      </div>

      <div className="example-urls">
        <span className="example-label">Try an example:</span>
        {exampleUrls.map((example) => (
          <button
            className="example-link"
            disabled={isLoading}
            key={example.url}
            onClick={() => {
              handleExampleClick(example.url);
            }}
            type="button"
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
