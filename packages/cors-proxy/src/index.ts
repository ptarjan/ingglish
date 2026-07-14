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

// Pre-compiled regex patterns for private/reserved IPv4 ranges (hoisted for performance)
const PRIVATE_IPV4_PATTERNS = [
  /^127\./, // Loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // Link-local
  /^0\./, // Current network
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT 100.64.0.0/10 (alt cloud metadata endpoints)
  /^192\.0\.0\./, // IETF protocol assignments 192.0.0.0/24
  /^198\.1[89]\./, // Benchmarking 198.18.0.0/15
  /^(22[4-9]|2[34]\d|25[0-5])\./, // Multicast 224.0.0.0/4, reserved 240.0.0.0/4, broadcast
];

/**
 * Checks if a hostname resolves to a private/internal IP address.
 * Prevents SSRF attacks by blocking requests to internal networks.
 * Accepts bare hostnames as well as bracketed IPv6 literals ("[::1]").
 */
export function isPrivateHost(hostname: string): boolean {
  // WHATWG URL wraps IPv6 literals in brackets — strip them before matching.
  const lowerHost = hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '');

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

  const groups = parseIPv6(lowerHost);
  if (groups !== null) {
    // ::  (unspecified) and ::1 (loopback)
    if (groups.every((g) => g === 0)) {
      return true;
    }
    if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) {
      return true;
    }
    // fc00::/7 unique local addresses
    if ((groups[0]! & 0xfe_00) === 0xfc_00) {
      return true;
    }
    // fe80::/10 link-local
    if ((groups[0]! & 0xff_c0) === 0xfe_80) {
      return true;
    }
    // IPv4-mapped (::ffff:a.b.c.d) and IPv4-compatible (::a.b.c.d):
    // re-check the embedded IPv4 against the private ranges above.
    const isMapped = groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xff_ff;
    const isCompat =
      groups.slice(0, 6).every((g) => g === 0) && (groups[6] !== 0 || groups[7] !== 0);
    if (isMapped || isCompat) {
      const a = groups[6]! >> 8;
      const b = groups[6]! & 0xff;
      const c = groups[7]! >> 8;
      const d = groups[7]! & 0xff;
      const dotted = `${a}.${b}.${c}.${d}`;
      if (PRIVATE_IPV4_PATTERNS.some((p) => p.test(dotted))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parses a colon-separated run of IPv6 groups (one side of a `::`), expanding a
 * trailing IPv4-mapped suffix like `127.0.0.1` into two 16-bit groups. Returns
 * null on any malformed piece.
 */
function ipv6GroupsFromRun(part: string): null | number[] {
  if (part === '') {
    return [];
  }
  const groups: number[] = [];
  for (const piece of part.split(':')) {
    if (piece.includes('.')) {
      const octets = piece.split('.').map(Number);
      if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
        return null;
      }
      groups.push((octets[0]! << 8) | octets[1]!, (octets[2]! << 8) | octets[3]!);
    } else {
      if (!/^[0-9a-f]{1,4}$/.test(piece)) {
        return null;
      }
      groups.push(Number.parseInt(piece, 16));
    }
  }
  return groups;
}

/**
 * Expands an IPv6 hostname (WHATWG-normalized, may contain an embedded
 * IPv4-mapped suffix) into its 8 16-bit groups, or returns null if it does
 * not parse as IPv6. Handles `::` compression.
 */
function parseIPv6(host: string): null | number[] {
  if (!host.includes(':')) {
    return null;
  }
  const halves = host.split('::');
  if (halves.length > 2) {
    return null;
  }

  const head = ipv6GroupsFromRun(halves[0]!);
  const tail = halves.length === 2 ? ipv6GroupsFromRun(halves[1]!) : [];
  if (head === null || tail === null) {
    return null;
  }
  if (halves.length === 1) {
    return head.length === 8 ? head : null;
  }
  const fill = 8 - head.length - tail.length;
  if (fill < 1) {
    return null;
  }
  return [...head, ...Array.from<number>({ length: fill }).fill(0), ...tail];
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
      // Follow redirects manually so every hop is re-validated against the
      // protocol allowlist and the private-network (SSRF) checks. `redirect:
      // 'follow'` would let an allowed public URL bounce us to an internal
      // address (e.g. 169.254.169.254 or [::1]) without any re-check.
      let response: Response;
      let currentUrl = parsedUrl;
      const MAX_REDIRECTS = 10;
      let redirects = 0;
      for (;;) {
        response = await fetch(currentUrl.toString(), {
          headers: {
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          redirect: 'manual',
        });

        const location = response.headers.get('Location');
        const isRedirect = response.status >= 300 && response.status < 400 && location !== null;
        if (!isRedirect) {
          break;
        }

        if (++redirects > MAX_REDIRECTS) {
          return new Response('Too many redirects', {
            headers: corsHeaders(origin),
            status: 502,
          });
        }

        let nextUrl: URL;
        try {
          nextUrl = new URL(location, currentUrl);
        } catch {
          return new Response('Invalid redirect location', {
            headers: corsHeaders(origin),
            status: 502,
          });
        }
        if (nextUrl.protocol !== 'http:' && nextUrl.protocol !== 'https:') {
          return new Response('Forbidden: redirect to disallowed protocol', {
            headers: corsHeaders(origin),
            status: 403,
          });
        }
        if (isPrivateHost(nextUrl.hostname)) {
          return new Response('Forbidden: redirect to private network', {
            headers: corsHeaders(origin),
            status: 403,
          });
        }
        currentUrl = nextUrl;
      }

      // Get content type and raw body (preserve original encoding for non-UTF-8 pages)
      const contentType = response.headers.get('Content-Type') ?? 'text/html';
      const body = await response.arrayBuffer();

      // Check if content is HTML - either by content-type or by content inspection
      // Some sites return text/plain for HTML or block proxies with wrong content-type
      const isHtmlContentType =
        contentType.includes('text/html') || contentType.includes('application/xhtml');

      if (!isHtmlContentType) {
        // Peek at first 1000 bytes as Latin1 (preserves all byte values regardless of encoding)
        const peek = new TextDecoder('latin1').decode(body.slice(0, 1000));
        const looksLikeHtml =
          peek.trimStart().startsWith('<!') ||
          peek.trimStart().startsWith('<?') ||
          peek.trimStart().toLowerCase().startsWith('<html') ||
          /<html[\s>]/i.test(peek);

        if (!looksLikeHtml) {
          const preview = peek.slice(0, 200);
          return new Response(
            `Only HTML content is supported (received: ${contentType})\n\nBody preview:\n${preview}`,
            {
              headers: corsHeaders(origin),
              status: 415,
            }
          );
        }
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

      return new Response(body, {
        headers: Object.assign({}, corsHeaders(origin), {
          'Cache-Control': cacheControl,
          'Content-Type': contentType,
          'X-Proxied-URL': currentUrl.toString(),
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
