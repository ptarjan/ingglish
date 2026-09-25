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
  // Merriam-Webster now serves a Cloudflare JS challenge to any server-side
  // fetch (proxy or not), so it never loads through the CORS proxy.
  { name: 'Dictionary', url: 'https://www.dictionary.com/browse/hello' },
  // news.ycombinator.com blocks requests from Cloudflare Workers'
  // (hosting-provider) IP ranges specifically — it returns a plain-text
  // "Sorry" page, so this fails through any Cloudflare Worker CORS proxy
  // even though it loads fine from a normal browser or residential IP.
  { name: 'Lobsters', url: 'https://lobste.rs' },
  { name: 'NPR', url: 'https://text.npr.org' },
  // nytimes.com blocks the proxy's (datacenter) IP via DataDome bot
  // protection, independent of the request's headers.
  { name: 'The Guardian', url: 'https://www.theguardian.com/us' },
  // old.reddit.com now redirects logged-out requests to a login wall
  // (confirmed even without going through any proxy), so it no longer shows
  // real content.
  { name: 'Tildes', url: 'https://tildes.net' },
  { name: 'GitHub', url: 'https://github.com/ptarjan/ingglish' },
];

interface UrlTranslatorProps {
  initialLang?: string;
  initialUrl?: string;
  onNavigate?: (url: string, lang?: string) => void;
  onShare?: (url: string, lang?: string) => string;
}

function UrlTranslator({ initialLang, initialUrl = '', onNavigate, onShare }: UrlTranslatorProps) {
  const { format, toggleFormat } = useFormat();
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => initialLang ?? localStorage.getItem('selectedLanguage') ?? 'en'
  );
  const handleLanguageDetected = useCallback((lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
  }, []);
  const { clear, dictLoading, error, hasContent, iframeRef, isLoading, setUrl, translateUrl, url } =
    useUrlTranslator({
      onLanguageDetected: handleLanguageDetected,
      onNavigate,
      outputFormat: format,
      selectedLanguage,
    });
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
  // or "Translate the page this sample comes from" link). Don't push history — the URL is already in the
  // address bar, so pushing would require an extra back-click to leave.
  const initialTranslatedRef = useRef(false);
  useEffect(() => {
    if (initialUrl.length > 0 && !initialTranslatedRef.current) {
      initialTranslatedRef.current = true;
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

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      setSelectedLanguage(lang);
      localStorage.setItem('selectedLanguage', lang);
      // Clear loaded content so the user picks a URL in the new language
      if (hasContent) {
        clear();
        // Clean up the browser URL (remove ?url= and ?lang= params)
        globalThis.history.replaceState(null, '', globalThis.location.pathname);
      }
    },
    [hasContent, clear]
  );

  // Sync browser URL's lang param when language changes (manual or auto-detected)
  useEffect(() => {
    const browserUrl = new URL(globalThis.location.href);
    const currentLang = browserUrl.searchParams.get('lang');
    const newLang = selectedLanguage === 'en' ? null : selectedLanguage;
    if (currentLang === newLang) {
      return;
    }

    if (newLang) {
      browserUrl.searchParams.set('lang', newLang);
    } else {
      browserUrl.searchParams.delete('lang');
    }
    globalThis.history.replaceState(history.state, '', browserUrl.toString());
  }, [selectedLanguage]);

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
          placeholder="Enter a web address, like example.com"
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
          title="Switch output format"
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

      {dictLoading && hasContent && (
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

      <p className="url-note">Browser security rules stop some websites from loading correctly.</p>
    </div>
  );
}

export default UrlTranslator;
