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
 * Also disables links by moving href to data-href (prevents navigation before JS handlers run).
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

    // Disable links by moving href to data-href
    // This prevents browser navigation before our JS handlers can intercept
    // Critical for mobile where touch events may not preventDefault in time
    doc.querySelectorAll('a[href]').forEach((anchor) => {
      const href = anchor.getAttribute('href');
      if (href !== null) {
        anchor.setAttribute('data-href', href);
        anchor.removeAttribute('href');
        // Add cursor pointer since removing href changes default cursor
        const existingStyle = anchor.getAttribute('style') ?? '';
        anchor.setAttribute('style', existingStyle + ';cursor:pointer');
      }
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
