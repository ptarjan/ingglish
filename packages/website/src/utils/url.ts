/**
 * URL utility functions for the URL translator.
 */

/**
 * Escapes HTML attribute values to prevent XSS.
 */
export function escapeHtmlAttr(text: string): string {
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

/**
 * Strips script tags and other active content from HTML.
 * Uses DOMParser in browser for reliability, falls back to regex in Node.
 */
export function stripScripts(html: string): string {
  // Use DOMParser in browser environments for more reliable parsing
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove all potentially executable elements
    doc
      .querySelectorAll('script, noscript, iframe, object, embed, frame, frameset')
      .forEach((el) => {
        el.remove();
      });

    // Also remove scripts inside template elements
    doc.querySelectorAll('template').forEach((template) => {
      const content = template.content;
      content.querySelectorAll('script').forEach((s) => {
        s.remove();
      });
    });

    // Remove inline event handlers (onclick, onload, onerror, etc.)
    doc.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });

    // Preserve doctype if present
    const doctype = doc.doctype
      ? `<!DOCTYPE ${doc.doctype.name}${doc.doctype.publicId ? ` PUBLIC "${doc.doctype.publicId}"` : ''}${doc.doctype.systemId ? ` "${doc.doctype.systemId}"` : ''}>`
      : '';

    return doctype + doc.documentElement.outerHTML;
  }

  // Fallback to regex for Node.js/test environments
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<object[^>]*>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<frame[^>]*>/gi, '')
    .replace(/<frameset[\s\S]*?<\/frameset>/gi, '');
}

/**
 * Rewrites font URLs in CSS to go through a CORS proxy.
 * This fixes font loading errors for cross-origin stylesheets.
 */
export function proxyFontUrls(html: string, proxyUrl: string): string {
  // Match url() in CSS with font file extensions
  const fontUrlPattern =
    /url\s*\(\s*(['"]?)(https?:\/\/[^)'"]+\.(?:woff2?|ttf|eot|otf)(?:\?[^)'"]*)?)\1\s*\)/gi;

  return html.replace(fontUrlPattern, (_match: string, quote: string, fontUrl: string) => {
    const proxiedUrl = `${proxyUrl}${encodeURIComponent(fontUrl)}`;
    return `url(${quote}${proxiedUrl}${quote})`;
  });
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

// Regex patterns for HTML tag matching (precompiled for performance)
const BODY_CLOSE_REGEX = /<\/body>/i;
const HTML_CLOSE_REGEX = /<\/html>/i;

/**
 * Script injected into iframe to capture link clicks via postMessage.
 * Handles both touch (iOS Safari) and click events.
 *
 * Readable version:
 * ```js
 * (function() {
 *   var touchTarget = null;
 *
 *   // Find closest anchor element (with IE11 fallback)
 *   function findAnchor(el) {
 *     return el && el.closest
 *       ? el.closest('a[href]')
 *       : (function(n) { while (n && n.tagName !== 'A') n = n.parentElement; return n; })(el);
 *   }
 *
 *   // Handle navigation for valid links
 *   function handleLink(anchor, event) {
 *     if (!anchor) return;
 *     var href = anchor.getAttribute('href');
 *     if (href && href.indexOf('javascript:') !== 0 && href.indexOf('#') !== 0 && href.indexOf('mailto:') !== 0) {
 *       event.preventDefault();
 *       event.stopPropagation();
 *       parent.postMessage({ type: 'ingglish-link-click', href: href }, '*');
 *     }
 *   }
 *
 *   // Track touch target for iOS Safari
 *   document.addEventListener('touchstart', function(e) { touchTarget = findAnchor(e.target); }, true);
 *   document.addEventListener('touchend', function(e) {
 *     if (touchTarget) { var a = touchTarget; touchTarget = null; handleLink(a, e); }
 *   }, true);
 *   document.addEventListener('click', function(e) { handleLink(findAnchor(e.target), e); }, true);
 * })();
 * ```
 */
const CLICK_HANDLER_SCRIPT = `<script>(function(){var t=null;function f(e){return e&&e.closest?e.closest('a[href]'):function(n){while(n&&n.tagName!=='A')n=n.parentElement;return n}(e)}function h(a,e){if(!a)return;var r=a.getAttribute('href');if(r&&r.indexOf('javascript:')!==0&&r.indexOf('#')!==0&&r.indexOf('mailto:')!==0){e.preventDefault();e.stopPropagation();parent.postMessage({type:'ingglish-link-click',href:r},'*')}}document.addEventListener('touchstart',function(e){t=f(e.target)},true);document.addEventListener('touchend',function(e){if(t){var a=t;t=null;h(a,e)}},true);document.addEventListener('click',function(e){h(f(e.target),e)},true)})();</script>`;

/**
 * Injects the click handler script before the closing body or html tag.
 */
function injectClickHandler(html: string): string {
  const bodyMatch = BODY_CLOSE_REGEX.exec(html);
  if (bodyMatch !== null) {
    return html.replace(bodyMatch[0], CLICK_HANDLER_SCRIPT + bodyMatch[0]);
  }

  const htmlMatch = HTML_CLOSE_REGEX.exec(html);
  if (htmlMatch !== null) {
    return html.replace(htmlMatch[0], CLICK_HANDLER_SCRIPT + htmlMatch[0]);
  }

  return html + CLICK_HANDLER_SCRIPT;
}

export interface ProcessHtmlOptions {
  /** The original page URL (for base tag) */
  pageUrl: string;
  /** The CORS proxy URL prefix */
  proxyUrl: string;
}

export interface ProcessHtmlResult {
  /** The processed HTML ready for iframe srcdoc */
  html: string;
  /** The base URL for resolving relative links */
  baseUrl: string;
}

/**
 * Processes raw HTML from a proxied page for safe display in an iframe.
 *
 * Pipeline:
 * 1. Detect bot protection pages (throws if detected)
 * 2. Strip scripts and dangerous elements
 * 3. Inject base tag for relative URL resolution
 * 4. Proxy font URLs through CORS proxy
 * 5. Inject click handler for link navigation
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
  const baseUrl = getBaseUrl(options.pageUrl);
  const htmlWithBase = injectBaseTag(stripScripts(rawHtml), baseUrl);

  // Step 4: Proxy font URLs
  const htmlWithFonts = proxyFontUrls(htmlWithBase, options.proxyUrl);

  // Step 5: Inject click handler
  const html = injectClickHandler(htmlWithFonts);

  return { html, baseUrl };
}
