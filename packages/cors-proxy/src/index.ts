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

export function isAllowedOrigin(origin: string | null, allowedOrigins: string): boolean {
  if (!origin) return false;

  const allowed = allowedOrigins.split(',').map((o) => o.trim());
  return allowed.some((allowedOrigin) => origin === allowedOrigin);
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      if (origin && isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
        return new Response(null, {
          status: 204,
          headers: corsHeaders(origin),
        });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate origin
    if (!origin || !isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return new Response('Forbidden: Invalid origin', { status: 403 });
    }

    // Parse the target URL from query parameter
    const requestUrl = new URL(request.url);
    const targetUrl = requestUrl.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing url parameter', {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    // Validate and parse target URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response('Invalid URL', {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response('Invalid protocol', {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    try {
      // Fetch the target URL
      const response = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IngglishBot/1.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      // Get content type
      const contentType = response.headers.get('Content-Type') || 'text/html';

      // Only proxy HTML content
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        return new Response('Only HTML content is supported', {
          status: 415,
          headers: corsHeaders(origin),
        });
      }

      const html = await response.text();

      return new Response(html, {
        status: response.status,
        headers: {
          ...corsHeaders(origin),
          'Content-Type': contentType,
          'X-Proxied-URL': parsedUrl.toString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Proxy error: ${message}`, {
        status: 502,
        headers: corsHeaders(origin),
      });
    }
  },
};
