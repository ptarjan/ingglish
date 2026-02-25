/**
 * Ingglish CORS Proxy - Cloudflare Worker
 *
 * Proxies requests to external websites for the Ingglish URL translator.
 * Includes security measures to prevent abuse:
 * - Origin validation (only allows requests from ingglish domains)
 * - Rate limiting via Cloudflare's built-in protections
 */

export interface Env {
  ALLOWED_ORIGINS: string;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Max-Age': '86400',
  };
}

export function isAllowedOrigin(origin: null | string, allowedOrigins: string): boolean {
  if (origin === null || origin === '') {
    return false;
  }

  // Avoid array allocations by checking directly during iteration
  let start = 0;
  for (let i = 0; i <= allowedOrigins.length; i++) {
    if (i === allowedOrigins.length || allowedOrigins[i] === ',') {
      const segment = allowedOrigins.slice(start, i).trim();
      if (segment === origin) {
        return true;
      }
      start = i + 1;
    }
  }
  return false;
}

// Pre-compiled regex patterns for private IPv4 ranges (hoisted for performance)
const PRIVATE_IPV4_PATTERNS = [
  /^127\./, // Loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // Link-local
  /^0\./, // Current network
];

/**
 * Checks if a hostname resolves to a private/internal IP address.
 * Prevents SSRF attacks by blocking requests to internal networks.
 */
export function isPrivateHost(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();

  // Block localhost
  if (lowerHost === 'localhost' || lowerHost === 'localhost.localdomain') {
    return true;
  }

  // Block private IPv4 ranges
  for (const pattern of PRIVATE_IPV4_PATTERNS) {
    if (pattern.test(lowerHost)) {
      return true;
    }
  }

  // Block IPv6 loopback and private
  if (lowerHost === '::1' || lowerHost.startsWith('fc') || lowerHost.startsWith('fd')) {
    return true;
  }

  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      if (origin !== null && isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
        return new Response(null, {
          headers: corsHeaders(origin),
          status: 204,
        });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate origin
    if (origin === null || !isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return new Response('Forbidden: Invalid origin', { status: 403 });
    }

    // Parse the target URL from query parameter
    const requestUrl = new URL(request.url);
    const targetUrl = requestUrl.searchParams.get('url');

    if (targetUrl === null || targetUrl === '') {
      return new Response('Missing url parameter', {
        headers: corsHeaders(origin),
        status: 400,
      });
    }

    // Validate and parse target URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response('Invalid URL', {
        headers: corsHeaders(origin),
        status: 400,
      });
    }

    // Only allow http/https (direct comparison avoids array allocation)
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new Response('Invalid protocol', {
        headers: corsHeaders(origin),
        status: 400,
      });
    }

    // Block requests to private/internal networks (SSRF protection)
    if (isPrivateHost(parsedUrl.hostname)) {
      return new Response('Forbidden: Private networks not allowed', {
        headers: corsHeaders(origin),
        status: 403,
      });
    }

    try {
      // Fetch the target URL with browser-like headers
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
      });

      // Get content type
      const contentType = response.headers.get('Content-Type') ?? 'text/html';
      const html = await response.text();

      // Check if content is HTML - either by content-type or by content inspection
      // Some sites return text/plain for HTML or block proxies with wrong content-type
      const isHtmlContentType =
        contentType.includes('text/html') || contentType.includes('application/xhtml');
      const looksLikeHtml =
        html.trimStart().startsWith('<!') ||
        html.trimStart().toLowerCase().startsWith('<html') ||
        /<html[\s>]/i.test(html.slice(0, 1000));

      if (!isHtmlContentType && !looksLikeHtml) {
        // Include first 200 chars of body for debugging blocked responses
        const preview = html.slice(0, 200);
        return new Response(
          `Only HTML content is supported (received: ${contentType})\n\nBody preview:\n${preview}`,
          {
            headers: corsHeaders(origin),
            status: 415,
          }
        );
      }

      // Ensure minimum 5 minute cache, default to 1 hour
      const MIN_CACHE_SECONDS = 300; // 5 minutes
      const DEFAULT_CACHE_SECONDS = 3600; // 1 hour
      const upstreamCacheControl = response.headers.get('Cache-Control');

      let cacheSeconds = DEFAULT_CACHE_SECONDS;
      if (upstreamCacheControl !== null) {
        const maxAgeMatch = /max-age=(\d+)/.exec(upstreamCacheControl);
        if (maxAgeMatch) {
          cacheSeconds = Math.max(Number.parseInt(maxAgeMatch[1]!, 10), MIN_CACHE_SECONDS);
        }
      }
      const cacheControl = `public, max-age=${cacheSeconds}`;

      return new Response(html, {
        headers: Object.assign({}, corsHeaders(origin), {
          'Cache-Control': cacheControl,
          'Content-Type': contentType,
          'X-Proxied-URL': parsedUrl.toString(),
        }),
        status: response.status,
      });
    } catch {
      return new Response('Proxy error: failed to fetch upstream resource', {
        headers: corsHeaders(origin),
        status: 502,
      });
    }
  },
};
