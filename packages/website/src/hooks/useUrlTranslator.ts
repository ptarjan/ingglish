/**
 * Custom hook for URL translation functionality.
 * Handles fetching pages through CORS proxy, translating content,
 * and intercepting link navigation.
 */
import { useState, useCallback, useRef } from 'react';
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
  translateUrl: (targetUrl: string) => Promise<void>;
  clear: () => void;
}

export function useUrlTranslator(options: UseUrlTranslatorOptions = {}): UseUrlTranslatorResult {
  const { onNavigate, outputFormat = 'ingglish' } = options;
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
          }
        });

        // Handle link navigation via click on neutralized links
        const handleLinkClick = (e: Event) => {
          const anchor = (e.target as HTMLElement).closest('a');
          if (!anchor) {
            return;
          }

          const href = anchor.getAttribute('data-original-href');
          if (href === null || href === '') {
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
            // eslint-disable-next-line no-console
            console.error('Navigation translation failed:', err);
          });
        };

        // Use capture phase for early interception
        iframeDoc.addEventListener('click', handleLinkClick, { capture: true });
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
