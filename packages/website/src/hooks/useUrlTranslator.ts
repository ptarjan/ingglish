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

        // Neutralize all links to prevent native navigation
        // This is critical for iOS Safari where touch events in iframes are
        // handled at the native level before JavaScript handlers fire
        const links = iframeDoc.querySelectorAll('a[href]');
        links.forEach((link) => {
          const anchor = link as HTMLAnchorElement;
          const href = anchor.getAttribute('href');
          if (href !== null && href !== '' && !shouldSkipUrl(href)) {
            // Store original href and neutralize the link
            anchor.setAttribute('data-original-href', href);
            anchor.removeAttribute('href');
            // Keep visual styling as a link
            anchor.style.cursor = 'pointer';
            // Make it tappable on iOS
            anchor.setAttribute('role', 'link');
          }
        });

        // Use pointerup for unified mouse/touch handling
        // Pointer events work across mouse, touch, and pen input
        iframeDoc.addEventListener(
          'pointerup',
          (e: PointerEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a[data-original-href]');
            if (!anchor) {
              return;
            }

            const href = anchor.getAttribute('data-original-href');
            if (href === null || href === '') {
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
