/**
 * Custom hook for URL translation functionality.
 * Handles fetching pages through CORS proxy, translating content,
 * and intercepting link navigation.
 */
import { useState, useCallback, useRef } from 'react';
import { translateDOM } from '@ingglish/core';

// Use custom proxy if configured, otherwise fall back to allorigins
const CORS_PROXY = import.meta.env.VITE_CORS_PROXY_URL || 'https://api.allorigins.win/raw?url=';

interface UseUrlTranslatorResult {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  hasContent: boolean;
  error: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  translateUrl: (targetUrl: string) => Promise<void>;
  clear: () => void;
}

/**
 * Injects a base tag into HTML so relative URLs resolve correctly.
 */
function injectBaseTag(html: string, origin: string): string {
  const baseTag = `<base href="${origin}/">`;

  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${baseTag}`);
  }
  if (html.includes('<html>')) {
    return html.replace('<html>', `<html><head>${baseTag}</head>`);
  }
  return baseTag + html;
}

/**
 * Checks if a URL should be ignored for navigation.
 */
function shouldSkipUrl(href: string): boolean {
  return (
    href.startsWith('#') ||
    href.startsWith('javascript:') ||
    href.startsWith('mailto:')
  );
}

export function useUrlTranslator(): UseUrlTranslatorResult {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const translateUrl = useCallback(async (targetUrl: string): Promise<void> => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) return;

    setIsLoading(true);
    setError(null);

    try {
      const parsedUrl = new URL(targetUrl);
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(parsedUrl.href)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const html = injectBaseTag(await response.text(), parsedUrl.origin);

      // Write HTML to iframe
      iframeDoc.open();
      iframeDoc.write(html); // eslint-disable-line @typescript-eslint/no-deprecated
      iframeDoc.close();

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Translate the DOM
      await translateDOM(iframeDoc.body, {
        skipTags: ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'SVG', 'MATH'],
        translateAttributes: true,
      });

      setHasContent(true);

      // Intercept link clicks for navigation
      iframeDoc.addEventListener('click', (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement).closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || shouldSkipUrl(href)) return;

        e.preventDefault();
        e.stopPropagation();

        let newUrl: string;
        try {
          newUrl = new URL(href, parsedUrl.href).href;
        } catch {
          return;
        }

        setUrl(newUrl);
        translateUrl(newUrl);
      });
    } catch (err) {
      setError(`Failed to load page: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setUrl('');
    setError(null);
    setHasContent(false);

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

  return {
    url,
    setUrl,
    isLoading,
    hasContent,
    error,
    iframeRef,
    translateUrl,
    clear,
  };
}

/**
 * Normalizes a URL input (adds https:// if missing).
 * Returns null if invalid.
 */
export function normalizeUrl(input: string): string | null {
  if (!input.trim()) return null;

  let urlString = input;
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    urlString = 'https://' + input;
  }

  try {
    new URL(urlString);
    return urlString;
  } catch {
    return null;
  }
}
