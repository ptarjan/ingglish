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

// Regex patterns for HTML tag matching (precompiled for performance)
const BODY_CLOSE_REGEX = /<\/body>/i;
const HTML_CLOSE_REGEX = /<\/html>/i;

// Script injected into iframe to capture link clicks via postMessage
// Handles both touch (iOS Safari) and click events
const CLICK_HANDLER_SCRIPT = `<script>(function(){var t=null;function f(e){return e&&e.closest?e.closest('a[href]'):function(n){while(n&&n.tagName!=='A')n=n.parentElement;return n}(e)}function h(a,e){if(!a)return;var r=a.getAttribute('href');if(r&&r.indexOf('javascript:')!==0&&r.indexOf('#')!==0&&r.indexOf('mailto:')!==0){e.preventDefault();e.stopPropagation();parent.postMessage({type:'ingglish-link-click',href:r},'*')}}document.addEventListener('touchstart',function(e){t=f(e.target)},true);document.addEventListener('touchend',function(e){if(t){var a=t;t=null;h(a,e)}},true);document.addEventListener('click',function(e){h(f(e.target),e)},true)})();</script>`;

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
  // Track the current base URL for resolving relative links from postMessage
  const baseUrlRef = useRef<string | null>(null);

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
        const htmlWithFonts = proxyFontUrls(htmlWithBase, CORS_PROXY);

        // Insert click handler script before closing </body> or </html> tag
        let html = htmlWithFonts;
        const bodyMatch = BODY_CLOSE_REGEX.exec(html);
        const htmlMatch = HTML_CLOSE_REGEX.exec(html);
        if (bodyMatch !== null) {
          html = html.replace(bodyMatch[0], CLICK_HANDLER_SCRIPT + bodyMatch[0]);
        } else if (htmlMatch !== null) {
          html = html.replace(htmlMatch[0], CLICK_HANDLER_SCRIPT + htmlMatch[0]);
        } else {
          html = html + CLICK_HANDLER_SCRIPT;
        }

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

        // Store base URL for resolving relative links from postMessage
        baseUrlRef.current = parsedUrl.href;

        // Show content immediately - translation happens in background
        setHasContent(true);

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
    [outputFormat]
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

  // Handle link clicks from iframe via postMessage (works on iOS)
  useEffect(() => {
    const handleMessage = (e: MessageEvent<unknown>) => {
      // Type guard for our message format
      const data = e.data as { type?: string; href?: string } | null;
      if (
        data?.type === 'ingglish-link-click' &&
        typeof data.href === 'string' &&
        baseUrlRef.current !== null
      ) {
        const href = data.href;
        // Skip special URLs
        if (shouldSkipUrl(href)) {
          return;
        }

        let newUrl: string;
        try {
          newUrl = new URL(href, baseUrlRef.current).href;
        } catch {
          return;
        }

        setUrl(newUrl);
        translateUrlRef
          .current?.(newUrl)
          .then(() => {
            onNavigate?.(newUrl);
          })
          .catch((err: unknown) => {
            // eslint-disable-next-line no-console
            console.error('Navigation translation failed:', err);
          });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onNavigate]);

  // Handle browser back/forward navigation
  // Also handle iOS Safari's BFCache restoration via pageshow event
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { translatorUrl?: string } | null;
      if (state?.translatorUrl !== undefined) {
        // Navigate back to a previous translated page
        // Immediately show loading to prevent flash of old content
        setIsLoading(true);
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

    // Handle BFCache restoration on iOS Safari
    // When user navigates back, Safari may restore from cache without firing popstate
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from BFCache - check if we need to retranslate
        const state = history.state as { translatorUrl?: string } | null;
        if (state?.translatorUrl !== undefined) {
          // Immediately show loading to prevent flash of stale content
          setIsLoading(true);
          setUrl(state.translatorUrl);
          translateUrlRef.current?.(state.translatorUrl, false).catch((err: unknown) => {
            // eslint-disable-next-line no-console
            console.error('BFCache restoration failed:', err);
          });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
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
