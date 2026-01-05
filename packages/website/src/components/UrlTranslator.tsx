import { useState, useCallback, useRef } from 'react';
import { translateDOMAsync } from '@ingglish/core';

function UrlTranslator() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslated, setIsTranslated] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!url.trim()) {
        setError('Please enter a URL');
        return;
      }

      let parsedUrl: URL;
      try {
        // Add protocol if missing
        let urlToFetch = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          urlToFetch = 'https://' + url;
        }
        parsedUrl = new URL(urlToFetch);
      } catch {
        setError('Invalid URL format');
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsTranslated(false);

      try {
        // Use a CORS proxy to fetch the URL
        // Note: In production, you'd want your own proxy server
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(parsedUrl.href)}`;

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

        // Create a new document in the iframe
        const iframe = iframeRef.current;
        if (!iframe) {
          return;
        }

        const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
        if (!iframeDoc) {
          return;
        }

        // Write the HTML to the iframe (document.write is necessary for iframe content)
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
    [url]
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

  return (
    <div className="url-translator">
      <form onSubmit={handleSubmit} className="url-form">
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

      <div className="info-box">
        <h3>URL Translation</h3>
        <p>
          Enter any URL to view the page with all text translated to Ingglish. Due to browser
          security restrictions, some websites may not load correctly.
        </p>
        <p>
          <strong>Tip:</strong> For the best experience, try simple text-based websites like
          Wikipedia articles or news sites.
        </p>
      </div>
    </div>
  );
}

export default UrlTranslator;
