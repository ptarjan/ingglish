import { useCallback, useEffect, useRef, useState } from 'react';
import { translateDOM } from '@ingglish/dom';
import type { OutputFormat } from '@ingglish/phonemes';
/**
 * Custom hook for URL translation functionality.
 * Handles fetching pages through CORS proxy, translating content,
 * and intercepting link navigation.
 */
import type { IpaDict } from '../pronounce/dict-loader';
import { loadDict } from '../pronounce/dict-loader';
import { NOT_FOUND_MARKER, translateForeign } from '../pronounce/ipa-to-ingglish';
import { isHashOnlyChange, processProxiedHtml, shouldSkipUrl } from '../url-proxy';

// Re-export utilities that components need
export { normalizeUrl } from '../url-proxy';

// Use custom proxy if configured, otherwise fall back to allorigins
const CORS_PROXY: string =
  import.meta.env.VITE_CORS_PROXY_URL ?? 'https://api.allorigins.win/raw?url=';

interface UseUrlTranslatorOptions {
  onNavigate?: (url: string) => void;
  outputFormat?: OutputFormat;
  selectedLanguage?: string;
}

interface UseUrlTranslatorResult {
  clear: () => void;
  dictLoading: boolean;
  error: null | string;
  hasContent: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isLoading: boolean;
  setUrl: (url: string) => void;
  translateUrl: (targetUrl: string, pushHistory?: boolean) => Promise<void>;
  url: string;
}

export function useUrlTranslator(options: UseUrlTranslatorOptions = {}): UseUrlTranslatorResult {
  const { onNavigate, outputFormat = 'ingglish', selectedLanguage = 'en' } = options;
  const isForeignMode = selectedLanguage !== 'en';
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [foreignDict, setForeignDict] = useState<IpaDict | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Track the current translateUrl function for popstate handler
  const translateUrlRef = useRef<((url: string, pushHistory?: boolean) => Promise<void>) | null>(
    null
  );
  // Track the current base URL for resolving relative links from postMessage
  const baseUrlRef = useRef<null | string>(null);
  // Track the current loaded URL (for detecting hash-only changes)
  const currentUrlRef = useRef<null | string>(null);
  // Track the previous format to detect changes
  const prevFormatRef = useRef<OutputFormat>(outputFormat);
  // Track the previous language to detect changes
  const prevLangRef = useRef<string>(selectedLanguage);

  // Handle hash-only navigation by scrolling within the iframe
  const scrollToHash = useCallback((hash: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) {
      return;
    }

    const targetId = hash.slice(1); // Remove the leading #
    if (!targetId) {
      return;
    }

    const targetElement =
      iframe.contentDocument.querySelector(`#${CSS.escape(targetId)}`) ??
      iframe.contentDocument.querySelector(`[name="${targetId}"]`);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Load foreign dictionary when language changes
  useEffect(() => {
    if (!isForeignMode) {
      setForeignDict(null);
      return;
    }

    let cancelled = false;
    setDictLoading(true);
    loadDict(selectedLanguage)
      .then((dict) => {
        if (!cancelled) {
          setForeignDict(dict);
          setDictLoading(false);
        }
      })
      .catch((error_: unknown) => {
        if (!cancelled) {
          console.error('Failed to load dictionary:', error_);
          setDictLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isForeignMode, selectedLanguage]);

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
        history.pushState({ translatorUrl: targetUrl }, '', globalThis.location.pathname);
        // Update URL in address bar immediately (before translation completes)
        onNavigate?.(targetUrl);
      } else {
        // Not pushing — just tag current entry with translator state so popstate
        // handler knows about this URL (e.g. initial load from /url?url=...)
        history.replaceState({ translatorUrl: targetUrl }, '', globalThis.location.href);
      }

      try {
        const parsedUrl = new URL(targetUrl);
        const proxyUrl = `${CORS_PROXY}${encodeURIComponent(parsedUrl.href)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const rawHtml = await response.text();

        // Process HTML: sanitize, inject base tag, proxy fonts, add click handler
        const { baseUrl, html } = processProxiedHtml(rawHtml, {
          pageUrl: parsedUrl.href,
          proxyUrl: CORS_PROXY,
        });

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
        baseUrlRef.current = baseUrl;
        // Store current URL for detecting hash-only navigation
        currentUrlRef.current = targetUrl;

        // Show content immediately - translation happens in background
        setHasContent(true);

        // Build translateFn for foreign mode
        const translateFn =
          isForeignMode && foreignDict
            ? (text: string, format: OutputFormat) =>
                translateForeign(text, foreignDict, format, selectedLanguage).replaceAll(
                  NOT_FOUND_MARKER,
                  ''
                )
            : undefined;

        // Translate the DOM with tooltips and larger chunks for faster rendering
        await translateDOM(iframeDoc.body, {
          chunked: true, // Use requestAnimationFrame for large pages
          chunkSize: 500, // Larger chunks = fewer DOM updates = faster
          outputFormat,
          showTooltips: true,
          translateAttributes: true,
          translateFn,
        });
      } catch (error_) {
        setError(
          `Failed to load page: ${error_ instanceof Error ? error_.message : 'Unknown error'}`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [outputFormat, onNavigate, isForeignMode, foreignDict, selectedLanguage]
  );

  const clear = useCallback(() => {
    setUrl('');
    setError(null);
    setHasContent(false);
    currentUrlRef.current = null;

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
      // srcdoc iframes have origin "null" (string literal)
      // Only accept messages from our iframe or same origin
      if (e.origin !== 'null' && e.origin !== globalThis.location.origin) {
        return;
      }

      // Type guard for our message format
      const data = e.data as null | { href?: string; type?: string };
      if (
        data?.type === 'ingglish-link-click' &&
        typeof data.href === 'string' &&
        baseUrlRef.current !== null
      ) {
        const href = data.href;
        // Skip special URLs (javascript:, mailto:, pure # links)
        if (shouldSkipUrl(href)) {
          return;
        }

        let newUrl: string;
        try {
          newUrl = new URL(href, baseUrlRef.current).href;
        } catch {
          return;
        }

        // Check if this is just a hash change on the same page
        if (currentUrlRef.current !== null && isHashOnlyChange(currentUrlRef.current, newUrl)) {
          // Just scroll to the target, don't refetch/retranslate
          const hash = new URL(newUrl).hash;
          scrollToHash(hash);
          // Update URL display without pushing to history (it's the same page)
          setUrl(newUrl);
          currentUrlRef.current = newUrl;
          onNavigate?.(newUrl);
          return;
        }

        setUrl(newUrl);
        translateUrlRef.current?.(newUrl).catch((error_: unknown) => {
          console.error('Navigation translation failed:', error_);
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [scrollToHash, onNavigate]);

  // Handle browser back/forward navigation
  // Also handle iOS Safari's BFCache restoration via pageshow event
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as null | { translatorUrl?: string };
      if (state?.translatorUrl === undefined) {
        // No translator state - clear the iframe
        setUrl('');
        setError(null);
        setHasContent(false);
        currentUrlRef.current = null;
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.srcdoc = '';
        }
      } else {
        const targetUrl = state.translatorUrl;

        // Check if this is just a hash change on the same page
        if (currentUrlRef.current !== null && isHashOnlyChange(currentUrlRef.current, targetUrl)) {
          // Just scroll to the target, don't refetch/retranslate
          const hash = new URL(targetUrl).hash;
          scrollToHash(hash);
          setUrl(targetUrl);
          currentUrlRef.current = targetUrl;
          return;
        }

        // Navigate back to a previous translated page
        // Immediately show loading to prevent flash of old content
        setIsLoading(true);
        setUrl(targetUrl);
        // Use false for pushHistory to avoid adding duplicate entries
        translateUrlRef.current?.(targetUrl, false).catch((error_: unknown) => {
          console.error('Back navigation failed:', error_);
        });
      }
    };

    // Handle BFCache restoration on iOS Safari
    // When user navigates back, Safari may restore from cache without firing popstate
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from BFCache - check if we need to retranslate
        const state = history.state as null | { translatorUrl?: string };
        if (state?.translatorUrl !== undefined) {
          // Immediately show loading to prevent flash of stale content
          setIsLoading(true);
          setUrl(state.translatorUrl);
          translateUrlRef.current?.(state.translatorUrl, false).catch((error_: unknown) => {
            console.error('BFCache restoration failed:', error_);
          });
        }
      }
    };

    globalThis.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      globalThis.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [scrollToHash]);

  // Retranslate when output format or language changes
  useEffect(() => {
    const formatChanged = prevFormatRef.current !== outputFormat;
    const langChanged = prevLangRef.current !== selectedLanguage;
    if ((formatChanged || langChanged) && hasContent && url.length > 0) {
      // Skip retranslation if switching to foreign mode but dict isn't loaded yet
      if (isForeignMode && !foreignDict) {
        // Will retranslate when dict finishes loading (foreignDict dep triggers this effect)
      } else {
        translateUrlRef.current?.(url, false).catch((error_: unknown) => {
          console.error('Format/language change retranslation failed:', error_);
        });
      }
    }
    prevFormatRef.current = outputFormat;
    prevLangRef.current = selectedLanguage;
  }, [outputFormat, hasContent, url, selectedLanguage, isForeignMode, foreignDict]);

  return {
    clear,
    dictLoading,
    error,
    hasContent,
    iframeRef,
    isLoading,
    setUrl,
    translateUrl,
    url,
  };
}
