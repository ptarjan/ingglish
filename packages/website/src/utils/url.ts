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
 * Distinguishes taps from scroll/pinch gestures on touch devices.
 *
 * Readable version:
 * ```js
 * (function() {
 *   var touchTarget = null;
 *   var touchStartX = 0;
 *   var touchStartY = 0;
 *   var touchHandled = false; // Flag to skip click after touch handled
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
 *     if (!href || href.indexOf('javascript:') === 0 || href.indexOf('mailto:') === 0) return;
 *
 *     // Prevent default immediately for all handled links
 *     event.preventDefault();
 *     event.stopPropagation();
 *
 *     // Handle pure hash links (#section) - scroll within iframe
 *     if (href.indexOf('#') === 0) {
 *       var id = href.slice(1);
 *       var target = document.getElementById(id) || document.querySelector('[name="' + id + '"]');
 *       if (target) target.scrollIntoView({ behavior: 'smooth' });
 *       return;
 *     }
 *
 *     // Handle external links - send to parent
 *     parent.postMessage({ type: 'ingglish-link-click', href: href }, '*');
 *   }
 *
 *   // Track touch target for iOS Safari - only single-touch taps
 *   document.addEventListener('touchstart', function(e) {
 *     touchHandled = false;
 *     // Ignore multi-touch (pinch gestures)
 *     if (e.touches.length > 1) { touchTarget = null; return; }
 *     touchTarget = findAnchor(e.target);
 *     var touch = e.touches[0];
 *     touchStartX = touch ? touch.clientX : 0;
 *     touchStartY = touch ? touch.clientY : 0;
 *   }, true);
 *
 *   // Clear touch target on multi-touch or significant movement (scroll)
 *   document.addEventListener('touchmove', function(e) {
 *     if (!touchTarget) return;
 *     if (e.touches.length > 1) { touchTarget = null; return; }
 *     var touch = e.touches[0];
 *     if (touch) {
 *       var dx = Math.abs(touch.clientX - touchStartX);
 *       var dy = Math.abs(touch.clientY - touchStartY);
 *       if (dx > 10 || dy > 10) touchTarget = null;
 *     }
 *   }, true);
 *
 *   document.addEventListener('touchend', function(e) {
 *     touchHandled = true; // Mark that we processed this touch
 *     if (touchTarget) { var a = touchTarget; touchTarget = null; handleLink(a, e); }
 *   }, true);
 *
 *   // Only handle click if it wasn't from a touch (mouse users)
 *   document.addEventListener('click', function(e) {
 *     if (touchHandled) { touchHandled = false; return; }
 *     handleLink(findAnchor(e.target), e);
 *   }, true);
 * })();
 * ```
 */
const CLICK_HANDLER_SCRIPT = `<script>(function(){var t=null,sx=0,sy=0,th=false;function f(e){return e&&e.closest?e.closest('a[href]'):function(n){while(n&&n.tagName!=='A')n=n.parentElement;return n}(e)}function h(a,e){if(!a)return;var r=a.getAttribute('href');if(!r||r.indexOf('javascript:')===0||r.indexOf('mailto:')===0)return;e.preventDefault();e.stopPropagation();if(r.indexOf('#')===0){var i=r.slice(1);var g=document.getElementById(i)||document.querySelector('[name="'+i+'"]');if(g)g.scrollIntoView({behavior:'smooth'});return}parent.postMessage({type:'ingglish-link-click',href:r},'*')}document.addEventListener('touchstart',function(e){th=false;if(e.touches.length>1){t=null;return}t=f(e.target);var c=e.touches[0];sx=c?c.clientX:0;sy=c?c.clientY:0},true);document.addEventListener('touchmove',function(e){if(!t)return;if(e.touches.length>1){t=null;return}var c=e.touches[0];if(c&&(Math.abs(c.clientX-sx)>10||Math.abs(c.clientY-sy)>10))t=null},true);document.addEventListener('touchend',function(e){th=true;if(t){var a=t;t=null;h(a,e)}},true);document.addEventListener('click',function(e){if(th){th=false;return}h(f(e.target),e)},true)})();</script>`;

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
