/**
 * Custom hook for URL translation functionality.
 * Handles fetching pages through CORS proxy, translating content,
 * and intercepting link navigation.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { translateDOM } from '@ingglish/dom';
import type { OutputFormat } from '@ingglish/dom';
import {
  injectBaseTag,
  getBaseUrl,
  shouldSkipUrl,
  detectBotProtection,
  proxyFontUrls,
  stripScripts,
} from '../utils/url';

// Re-export utilities that components need
export { normalizeUrl } from '../utils/url';

// Use custom proxy if configured, otherwise fall back to allorigins
const CORS_PROXY: string =
  import.meta.env.VITE_CORS_PROXY_URL ?? 'https://api.allorigins.win/raw?url=';

interface UseUrlTranslatorOptions {
  onNavigate?: (url: string) => void;
  outputFormat?: OutputFormat;
}

interface UseUrlTranslatorResult {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  hasContent: boolean;
  error: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  translateUrl: (targetUrl: string, pushHistory?: boolean) => Promise<void>;
  clear: () => void;
}

export function useUrlTranslator(options: UseUrlTranslatorOptions = {}): UseUrlTranslatorResult {
  const { onNavigate, outputFormat = 'ingglish' } = options;
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Track the current translateUrl function for popstate handler
  const translateUrlRef = useRef<((url: string, pushHistory?: boolean) => Promise<void>) | null>(
    null
  );

  const translateUrl = useCallback(
    async (targetUrl: string, pushHistory = true): Promise<void> => {
      const iframe = iframeRef.current;
      if (!iframe) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // Push to browser history so back button works
      if (pushHistory) {
        history.pushState({ translatorUrl: targetUrl }, '', window.location.pathname);
      }

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

        const htmlWithBase = injectBaseTag(stripScripts(rawHtml), getBaseUrl(parsedUrl.href));
        const html = proxyFontUrls(htmlWithBase, CORS_PROXY);

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

        // Show content immediately - translation happens in background
        setHasContent(true);

        // Navigate to a new URL within the translator
        const navigateToUrl = (href: string) => {
          let newUrl: string;
          try {
            newUrl = new URL(href, parsedUrl.href).href;
          } catch {
            return;
          }

          setUrl(newUrl);
          // translateUrl must be called BEFORE onNavigate because:
          // - translateUrl pushes new history entry with state
          // - onNavigate updates the URL of current entry
          // If reversed, onNavigate would update the wrong entry
          translateUrl(newUrl)
            .then(() => {
              onNavigate?.(newUrl);
            })
            .catch((err: unknown) => {
              // eslint-disable-next-line no-console
              console.error('Navigation translation failed:', err);
            });
        };

        // Use event delegation at document level - more robust when DOM is modified
        // Track touch target to handle tap correctly
        let touchTarget: HTMLAnchorElement | null = null;

        iframeDoc.addEventListener(
          'touchstart',
          (e) => {
            const anchor = (e.target as Element).closest?.('a[href]');
            if (anchor) {
              const href = anchor.getAttribute('href');
              if (href !== null && href !== '' && !shouldSkipUrl(href)) {
                touchTarget = anchor;
                e.preventDefault();
              }
            }
          },
          { capture: true, passive: false }
        );

        iframeDoc.addEventListener(
          'touchend',
          (e) => {
            if (touchTarget) {
              const href = touchTarget.getAttribute('href');
              touchTarget = null;
              if (href !== null && href !== '') {
                e.preventDefault();
                navigateToUrl(href);
              }
            }
          },
          { capture: true, passive: false }
        );

        iframeDoc.addEventListener(
          'click',
          (e) => {
            const anchor = (e.target as Element).closest?.('a[href]');
            if (anchor) {
              const href = anchor.getAttribute('href');
              if (href !== null && href !== '' && !shouldSkipUrl(href)) {
                e.preventDefault();
                e.stopPropagation();
                navigateToUrl(href);
              }
            }
          },
          { capture: true }
        );

        // Translate the DOM with tooltips and larger chunks for faster rendering
        await translateDOM(iframeDoc.body, {
          translateAttributes: true,
          showTooltips: true,
          outputFormat,
          chunked: true, // Use requestAnimationFrame for large pages
          chunkSize: 500, // Larger chunks = fewer DOM updates = faster
        });
      } catch (err) {
        setError(`Failed to load page: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    },
    [onNavigate, outputFormat]
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

  // Keep ref updated for popstate handler
  translateUrlRef.current = translateUrl;

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { translatorUrl?: string } | null;
      if (state?.translatorUrl !== undefined) {
        // Navigate back to a previous translated page
        setUrl(state.translatorUrl);
        // Use false for pushHistory to avoid adding duplicate entries
        translateUrlRef.current?.(state.translatorUrl, false).catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('Back navigation failed:', err);
        });
      } else {
        // No translator state - clear the iframe
        setUrl('');
        setError(null);
        setHasContent(false);
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.srcdoc = '';
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
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
