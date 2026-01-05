import { useState, useCallback, useRef } from 'react';
import { translateDOMAsync } from '@ingglish/core';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const EXAMPLE_URLS = [
  { name: 'Wikipedia: English', url: 'https://en.wikipedia.org/wiki/English_language' },
  { name: 'US Constitution', url: 'https://www.archives.gov/founding-docs/constitution-transcript' },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML' },
  { name: 'Creative Commons', url: 'https://creativecommons.org/about/' },
];

function UrlTranslator() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Core function to fetch and translate a URL
  const fetchAndTranslate = useCallback(async (targetUrl: string): Promise<void> => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const parsedUrl = new URL(targetUrl);
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(parsedUrl.href)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    let html = await response.text();

    // Inject a <base> tag so relative URLs (images, CSS, etc.) resolve to the original site
    const baseTag = `<base href="${parsedUrl.origin}/">`;
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${baseTag}`);
    } else if (html.includes('<html>')) {
      html = html.replace('<html>', `<html><head>${baseTag}</head>`);
    } else {
      html = baseTag + html;
    }

    // Write the HTML to the iframe
    iframeDoc.open();
    iframeDoc.write(html); // eslint-disable-line @typescript-eslint/no-deprecated
    iframeDoc.close();

    // Wait for the iframe to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Translate the DOM
    await translateDOMAsync(iframeDoc.body, {
      skipTags: ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'MATH'],
      translateAttributes: true,
    });

    // Intercept link clicks to translate navigated pages
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip javascript: links, anchors, and mailto:
      if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Resolve relative URLs against the current page
      let newUrl: string;
      try {
        newUrl = new URL(href, parsedUrl.href).href;
      } catch {
        return;
      }

      // Update the URL input and trigger navigation
      setUrl(newUrl);
      setIsLoading(true);
      setError(null);
      setIsTranslated(false);

      fetchAndTranslate(newUrl)
        .then(() => {
          setIsTranslated(true);
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(`Failed to load page: ${message}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    iframeDoc.addEventListener('click', handleLinkClick);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!url.trim()) {
        setError('Please enter a URL');
        return;
      }

      let urlToFetch = url;
      try {
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          urlToFetch = 'https://' + url;
        }
        new URL(urlToFetch); // Validate URL format
      } catch {
        setError('Invalid URL format');
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsTranslated(false);

      try {
        await fetchAndTranslate(urlToFetch);
        setIsTranslated(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(
          `Failed to load page: ${message}. Note: Some websites block cross-origin requests.`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [url, fetchAndTranslate]
  );

  const handleClear = useCallback(() => {
    setUrl('');
    setError(null);
    setIsTranslated(false);
    const iframe = iframeRef.current;
    if (iframe) {
      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(''); // eslint-disable-line @typescript-eslint/no-deprecated
        iframeDoc.close();
      }
    }
  }, []);

  const handleExampleClick = useCallback((exampleUrl: string) => {
    setUrl(exampleUrl);
    // Trigger form submission after setting URL
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  }, []);

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
        <button type="button" onClick={handleClear} className="btn-secondary">
          Clear
        </button>
      </form>

      {error !== null && <div className="error-message">{error}</div>}

      {isTranslated && <div className="success-message">Page translated to Ingglish!</div>}

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
