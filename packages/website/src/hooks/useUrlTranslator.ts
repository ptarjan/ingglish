/**
 * Custom hook for URL translation functionality.
 * Handles fetching pages through CORS proxy, translating content,
 * and intercepting link navigation.
 */
import { useState, useCallback, useRef } from 'react';
import { translateDOM } from '@ingglish/core';

// Use custom proxy if configured, otherwise fall back to allorigins
const CORS_PROXY: string =
  import.meta.env.VITE_CORS_PROXY_URL ?? 'https://api.allorigins.win/raw?url=';

interface UseUrlTranslatorOptions {
  onNavigate?: (url: string) => void;
}

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
 * Escapes HTML attribute values to prevent XSS.
 */
function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Injects a base tag into HTML so relative URLs resolve correctly.
 * Uses the full URL path (up to last slash) so relative links work properly.
 */
export function injectBaseTag(html: string, baseUrl: string): string {
  const safeBaseUrl = escapeHtmlAttr(baseUrl);
  const baseTag = `<base href="${safeBaseUrl}">`;

  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${baseTag}`);
  }
  if (html.includes('<html>')) {
    return html.replace('<html>', `<html><head>${baseTag}</head>`);
  }
  return baseTag + html;
}

/**
 * Gets the base URL for a page (URL up to and including the last slash).
 * For https://example.com/path/page.html → https://example.com/path/
 * For https://example.com/path/ → https://example.com/path/
 */
export function getBaseUrl(url: string): string {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split('/');
  // If pathname ends with slash or has no extension, keep it as-is
  // Otherwise, remove the filename part
  if (parsed.pathname.endsWith('/') || !pathParts[pathParts.length - 1].includes('.')) {
    return parsed.origin + parsed.pathname + (parsed.pathname.endsWith('/') ? '' : '/');
  }
  // Remove filename, keep directory
  pathParts.pop();
  return parsed.origin + pathParts.join('/') + '/';
}

/**
 * Checks if a URL should be ignored for navigation.
 */
export function shouldSkipUrl(href: string): boolean {
  return href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:');
}

/**
 * Detects if HTML content is a bot protection/challenge page.
 * Returns a user-friendly error message if detected, null otherwise.
 */
export function detectBotProtection(html: string): string | null {
  const lowerHtml = html.toLowerCase();

  // Cloudflare challenge page ("Just a moment...")
  if (lowerHtml.includes('window._cf_chl_opt') || lowerHtml.includes('challenge-platform')) {
    return 'This site uses Cloudflare protection and requires JavaScript verification';
  }

  // Cloudflare block page ("Sorry, you have been blocked")
  if (
    lowerHtml.includes('you have been blocked') ||
    lowerHtml.includes('attention required! | cloudflare')
  ) {
    return 'This site has blocked the request (Cloudflare protection)';
  }

  // JavaScript/robot verification pages
  if (
    (lowerHtml.includes('javascript is disabled') &&
      lowerHtml.includes("verify that you're not a robot")) ||
    (lowerHtml.includes('enable javascript') && lowerHtml.includes('continue'))
  ) {
    return 'This site requires JavaScript verification to access';
  }

  return null;
}

export function useUrlTranslator(options: UseUrlTranslatorOptions = {}): UseUrlTranslatorResult {
  const { onNavigate } = options;
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const translateUrl = useCallback(
    async (targetUrl: string): Promise<void> => {
      const iframe = iframeRef.current;
      if (!iframe) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const parsedUrl = new URL(targetUrl);
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(parsedUrl.href)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const rawHtml = await response.text();

        // Check for bot protection pages before processing
        const botProtectionError = detectBotProtection(rawHtml);
        if (botProtectionError !== null) {
          throw new Error(botProtectionError);
        }

        const html = injectBaseTag(rawHtml, getBaseUrl(parsedUrl.href));

        // Load HTML into iframe using srcdoc and wait for load event
        await new Promise<void>((resolve) => {
          const onLoad = () => {
            iframe.removeEventListener('load', onLoad);
            resolve();
          };
          iframe.addEventListener('load', onLoad);
          iframe.srcdoc = html;
        });

        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc?.body) {
          throw new Error('Failed to access iframe content');
        }

        // Translate the DOM
        await translateDOM(iframeDoc.body, {
          translateAttributes: true,
        });

        setHasContent(true);

        // Intercept link clicks for navigation
        iframeDoc.addEventListener('click', (e: MouseEvent) => {
          const anchor = (e.target as HTMLElement).closest('a');
          if (!anchor) {
            return;
          }

          const href = anchor.getAttribute('href');
          if (href === null || href === '' || shouldSkipUrl(href)) {
            return;
          }

          e.preventDefault();
          e.stopPropagation();

          let newUrl: string;
          try {
            newUrl = new URL(href, parsedUrl.href).href;
          } catch {
            return;
          }

          setUrl(newUrl);
          onNavigate?.(newUrl);
          translateUrl(newUrl).catch((err: unknown) => {
            // Error is already handled in translateUrl, but log for debugging
            // eslint-disable-next-line no-console
            console.error('Navigation translation failed:', err);
          });
        });
      } catch (err) {
        setError(`Failed to load page: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    },
    [onNavigate]
  );

  const clear = useCallback(() => {
    setUrl('');
    setError(null);
    setHasContent(false);

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.srcdoc = '';
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
  if (!input.trim()) {
    return null;
  }

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
