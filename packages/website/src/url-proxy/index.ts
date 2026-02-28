/**
 * URL utility functions for the URL translator.
 */

import DOMPurify from 'dompurify';

/**
 * Detects if HTML content is a bot protection/challenge page.
 * Returns a user-friendly error message if detected, null otherwise.
 */
export function detectBotProtection(html: string): null | string {
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

/**
 * Escapes HTML attribute values to prevent XSS.
 */
export function escapeHtmlAttr(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * Extracts the href from an existing <base> tag in HTML, if present.
 * Returns null if no base tag with href is found.
 */
export function extractBaseHref(html: string): null | string {
  const match = /<base\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i.exec(html);
  return match?.[1] ?? null;
}

/**
 * Extracts the canonical URL from HTML meta tags.
 * Checks <link rel="canonical"> and <meta property="og:url">.
 * Useful for detecting the true page URL after a CORS proxy follows redirects.
 */
export function extractCanonicalUrl(html: string): null | string {
  // <link rel="canonical" href="...">
  const canonical =
    /<link\s[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']+)["'][^>]*>/i.exec(html) ??
    /<link\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']canonical["'][^>]*>/i.exec(html);
  if (canonical?.[1]) {
    return canonical[1];
  }

  // <meta property="og:url" content="...">
  const ogUrl =
    /<meta\s[^>]*property\s*=\s*["']og:url["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i.exec(
      html
    ) ??
    /<meta\s[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:url["'][^>]*>/i.exec(
      html
    );
  if (ogUrl?.[1]) {
    return ogUrl[1];
  }

  return null;
}

/**
 * Gets the base URL for a page (URL up to and including the last slash).
 * Uses standard URL resolution: strip everything after the last slash.
 * For https://example.com/path/page → https://example.com/path/
 * For https://example.com/path/ → https://example.com/path/
 */
export function getBaseUrl(url: string): string {
  const parsed = new URL(url);
  const lastSlash = parsed.pathname.lastIndexOf('/');
  const basePath = parsed.pathname.slice(0, Math.max(0, lastSlash + 1));
  return parsed.origin + basePath;
}

/**
 * Injects a base tag into HTML so relative URLs resolve correctly.
 * If the HTML already contains a <base> tag with an href, it is left as-is.
 * Uses the full URL path (up to last slash) so relative links work properly.
 */
export function injectBaseTag(html: string, baseUrl: string): string {
  // Don't override an existing <base> tag — the page author knows best
  if (extractBaseHref(html) !== null) {
    return html;
  }

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
 * Checks if two URLs are the same except for the hash fragment.
 * Returns true if navigating from oldUrl to newUrl is just a hash change.
 */
export function isHashOnlyChange(oldUrl: string, newUrl: string): boolean {
  try {
    const oldParsed = new URL(oldUrl);
    const newParsed = new URL(newUrl);
    // Normalize pathnames by removing trailing slash for comparison
    const oldPath = oldParsed.pathname.replace(/\/$/, '');
    const newPath = newParsed.pathname.replace(/\/$/, '');
    // Same origin, pathname (ignoring trailing slash), and search - only hash differs
    return (
      oldParsed.origin === newParsed.origin &&
      oldPath === newPath &&
      oldParsed.search === newParsed.search &&
      newParsed.hash !== ''
    );
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL input (adds https:// if missing).
 * Returns null if invalid.
 */
export function normalizeUrl(input: string): null | string {
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

/**
 * Rewrites font URLs in CSS to go through a CORS proxy.
 * This fixes font loading errors for cross-origin stylesheets.
 */
export function proxyFontUrls(html: string, proxyUrl: string): string {
  // Match url() in CSS with font file extensions
  const fontUrlPattern =
    /url\s*\(\s*(['"]?)(https?:\/\/[^)\s'"]+\.(?:woff2?|ttf|eot|otf)(?:\?[^)\s'"]*)?)\1\s*\)/gi;

  return html.replaceAll(fontUrlPattern, (_match: string, quote: string, fontUrl: string) => {
    const proxiedUrl = `${proxyUrl}${encodeURIComponent(fontUrl)}`;
    return `url(${quote}${proxiedUrl}${quote})`;
  });
}

/**
 * Checks if a URL should be ignored for navigation.
 */
export function shouldSkipUrl(href: string): boolean {
  return href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:');
}

/**
 * Strips script tags and other active content from HTML.
 * Uses DOMPurify in browser for comprehensive mXSS protection,
 * falls back to regex in Node.js/test environments.
 */
export function stripScripts(html: string): string {
  if (typeof DOMParser !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ADD_ATTR: [
        'href',
        'rel',
        'type',
        'media',
        'content',
        'http-equiv',
        'charset',
        'name',
        'property',
      ],
      ADD_TAGS: ['link', 'style', 'meta', 'base'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
      FORBID_TAGS: ['script', 'noscript', 'iframe', 'object', 'embed', 'frame', 'frameset', 'form'],
      WHOLE_DOCUMENT: true,
    });
  }

  // Fallback to regex for Node.js/test environments
  return html
    .replaceAll(/<script[\s\S]*?<\/script>/gi, '')
    .replaceAll(/<script[^>]*>/gi, '')
    .replaceAll(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replaceAll(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replaceAll(/<iframe[^>]*>/gi, '')
    .replaceAll(/<object[\s\S]*?<\/object>/gi, '')
    .replaceAll(/<object[^>]*>/gi, '')
    .replaceAll(/<embed[^>]*>/gi, '')
    .replaceAll(/<frame[^>]*>/gi, '')
    .replaceAll(/<frameset[\s\S]*?<\/frameset>/gi, '');
}

// Regex patterns for HTML tag matching (precompiled for performance)
const BODY_CLOSE_REGEX = /<\/body>/i;
const HTML_CLOSE_REGEX = /<\/html>/i;
const HEAD_OPEN_REGEX = /<head[^>]*>/i;

/** Generates a cryptographically random nonce for CSP. */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Minified click handler injected into the iframe.
 *
 * Required because iOS Safari doesn't fire parent-attached event listeners
 * on sandboxed iframe documents — the script must run inside the iframe itself.
 * The iframe uses sandbox="allow-same-origin allow-scripts", with DOMPurify
 * stripping all page scripts first and a CSP nonce ensuring only this handler
 * can execute.
 *
 * Captures link clicks (touch + mouse) and sends them to the parent via
 * postMessage. Distinguishes taps from scroll/pinch gestures on touch devices.
 */
const CLICK_HANDLER_BODY = `(function(){var t=null,sx=0,sy=0,th=false;function f(e){return e&&e.closest?e.closest('a[href]'):function(n){while(n&&n.tagName!=='A')n=n.parentElement;return n}(e)}function h(a,e){if(!a)return;var r=a.getAttribute('href');if(!r||r.indexOf('javascript:')===0||r.indexOf('mailto:')===0)return;e.preventDefault();e.stopPropagation();if(r.indexOf('#')===0){var i=r.slice(1);var g=document.querySelector('#'+CSS.escape(i))||document.querySelector('[name="'+i+'"]');if(g)g.scrollIntoView({behavior:'smooth'});return}parent.postMessage({type:'ingglish-link-click',href:r},'*')}document.addEventListener('touchstart',function(e){th=false;if(e.touches.length>1){t=null;return}t=f(e.target);var c=e.touches[0];sx=c?c.clientX:0;sy=c?c.clientY:0},true);document.addEventListener('touchmove',function(e){if(!t)return;if(e.touches.length>1){t=null;return}var c=e.touches[0];if(c&&(Math.abs(c.clientX-sx)>10||Math.abs(c.clientY-sy)>10))t=null},true);document.addEventListener('touchend',function(e){th=true;if(t){var a=t;t=null;h(a,e)}},true);document.addEventListener('click',function(e){if(th){th=false;return}h(f(e.target),e)},true)})();`;

export interface ProcessHtmlOptions {
  /** The original page URL (for base tag) */
  pageUrl: string;
  /** The CORS proxy URL prefix */
  proxyUrl: string;
}

export interface ProcessHtmlResult {
  /** The base URL for resolving relative links */
  baseUrl: string;
  /** The processed HTML ready for iframe srcdoc */
  html: string;
}

/**
 * Processes raw HTML from a proxied page for safe display in an iframe.
 *
 * Pipeline:
 * 1. Detect bot protection pages (throws if detected)
 * 2. Strip scripts and dangerous elements (DOMPurify)
 * 3. Inject base tag for relative URL resolution
 * 4. Proxy font URLs through CORS proxy
 * 5. Inject CSP meta tag with nonce (defense-in-depth)
 * 6. Inject nonce'd click handler for link navigation
 *
 * @throws Error if bot protection is detected
 */
export function processProxiedHtml(
  rawHtml: string,
  options: ProcessHtmlOptions
): ProcessHtmlResult {
  // Step 1: Check for bot protection
  const botProtectionError = detectBotProtection(rawHtml);
  if (botProtectionError !== null) {
    throw new Error(botProtectionError);
  }

  // Step 2-3: Strip scripts and inject base tag
  const sanitized = stripScripts(rawHtml);
  const existingBase = extractBaseHref(sanitized);
  // If the page has a canonical URL (from <link rel="canonical"> or og:url),
  // prefer it over the request URL — the CORS proxy follows redirects silently,
  // so the original URL may differ from the page's actual location.
  const canonicalUrl = extractCanonicalUrl(rawHtml);
  const effectivePageUrl = canonicalUrl ?? options.pageUrl;
  const baseUrl = existingBase ?? getBaseUrl(effectivePageUrl);
  const htmlWithBase = injectBaseTag(sanitized, baseUrl);

  // Step 4: Proxy font URLs
  const htmlWithFonts = proxyFontUrls(htmlWithBase, options.proxyUrl);

  // Step 5: Inject CSP meta tag with nonce (defense-in-depth)
  const nonce = generateNonce();
  const htmlWithCsp = injectCspMetaTag(htmlWithFonts, nonce);

  // Step 6: Inject nonce'd click handler
  const html = injectClickHandler(htmlWithCsp, nonce);

  return { baseUrl, html };
}

/**
 * Builds the CSP meta tag that restricts script execution to the given nonce.
 */
function buildCspMetaTag(nonce: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="script-src 'nonce-${nonce}'; style-src 'unsafe-inline' *; img-src *; font-src *; default-src 'self' *;">`;
}

/**
 * Injects the nonce'd click handler script before </body>, </html>, or at the end.
 */
function injectClickHandler(html: string, nonce: string): string {
  const script = `<script nonce="${nonce}">${CLICK_HANDLER_BODY}</script>`;

  const bodyMatch = BODY_CLOSE_REGEX.exec(html);
  if (bodyMatch !== null) {
    return html.replace(bodyMatch[0], script + bodyMatch[0]);
  }

  const htmlMatch = HTML_CLOSE_REGEX.exec(html);
  if (htmlMatch !== null) {
    return html.replace(htmlMatch[0], script + htmlMatch[0]);
  }

  return html + script;
}

/**
 * Injects the CSP meta tag into the <head> of the HTML.
 */
function injectCspMetaTag(html: string, nonce: string): string {
  const cspTag = buildCspMetaTag(nonce);
  const headMatch = HEAD_OPEN_REGEX.exec(html);
  if (headMatch !== null) {
    return html.replace(headMatch[0], headMatch[0] + cspTag);
  }
  return cspTag + html;
}
