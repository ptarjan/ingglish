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

        // Translate the DOM with tooltips and chunked updates for smooth rendering
        await translateDOM(iframeDoc.body, {
          translateAttributes: true,
          showTooltips: true,
          outputFormat,
          chunked: true, // Use requestAnimationFrame for large pages
          chunkSize: 100,
        });

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
          onNavigate?.(newUrl);
          translateUrl(newUrl).catch((err: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Navigation translation failed:', err);
          });
        };

        // Handle link clicks - intercept before native navigation
        // Track touched anchor for iOS Safari where touchend target can differ
        let touchedAnchor: HTMLAnchorElement | null = null;

        // Use touchstart to prevent default early on iOS Safari
        iframeDoc.addEventListener(
          'touchstart',
          (e: TouchEvent) => {
            touchedAnchor = null;
            const target = e.target as HTMLElement;
            const anchor = target.closest<HTMLAnchorElement>('a[href]');
            if (!anchor) {
              return;
            }

            const href = anchor.getAttribute('href');
            if (href === null || href === '' || shouldSkipUrl(href)) {
              return;
            }

            // Store anchor and prevent default to stop iOS from following the link
            touchedAnchor = anchor;
            e.preventDefault();
          },
          { capture: true, passive: false }
        );

        // Handle the actual navigation on touchend
        iframeDoc.addEventListener(
          'touchend',
          (e: TouchEvent) => {
            // Use the anchor captured in touchstart
            const anchor = touchedAnchor;
            touchedAnchor = null;

            if (!anchor) {
              return;
            }

            const href = anchor.getAttribute('href');
            if (href === null || href === '' || shouldSkipUrl(href)) {
              return;
            }

            e.preventDefault();
            // Defer to next tick to avoid mobile Safari touch event issues
            setTimeout(() => {
              navigateToUrl(href);
            }, 0);
          },
          { capture: true, passive: false }
        );

        // Handle clicks for desktop
        iframeDoc.addEventListener(
          'click',
          (e: Event) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a[href]');
            if (!anchor) {
              return;
            }

            const href = anchor.getAttribute('href');
            if (href === null || href === '' || shouldSkipUrl(href)) {
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            navigateToUrl(href);
          },
          { capture: true }
        );
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
