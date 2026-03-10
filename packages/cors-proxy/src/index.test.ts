import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { corsHeaders, isAllowedOrigin, isPrivateHost } from './index';

describe('cors-proxy', () => {
  describe('isAllowedOrigin', () => {
    const allowedOrigins = 'https://ingglish.com,http://localhost:5173';

    it('should allow exact match', () => {
      expect(isAllowedOrigin('https://ingglish.com', allowedOrigins)).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173', allowedOrigins)).toBe(true);
    });

    it('should reject non-matching origins', () => {
      expect(isAllowedOrigin('https://evil.com', allowedOrigins)).toBe(false);
      expect(isAllowedOrigin('https://ingglish.com.evil.com', allowedOrigins)).toBe(false);
    });

    it('should reject null origin', () => {
      expect(isAllowedOrigin(null, allowedOrigins)).toBe(false);
    });

    it('should handle whitespace in allowed origins', () => {
      const withSpaces = 'https://a.com, https://b.com';
      expect(isAllowedOrigin('https://b.com', withSpaces)).toBe(true);
    });
  });

  describe('corsHeaders', () => {
    it('should return correct CORS headers', () => {
      const headers = corsHeaders('https://example.com');
      expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
    });
  });

  describe('isPrivateHost', () => {
    it.each([
      ['localhost', true, 'localhost'],
      ['LOCALHOST', true, 'localhost uppercase'],
      ['localhost.localdomain', true, 'localhost.localdomain'],
      ['127.0.0.1', true, 'loopback start'],
      ['127.0.0.255', true, 'loopback mid'],
      ['127.255.255.255', true, 'loopback end'],
      ['10.0.0.1', true, 'Class A start'],
      ['10.255.255.255', true, 'Class A end'],
      ['172.16.0.1', true, 'Class B start'],
      ['172.31.255.255', true, 'Class B end'],
      ['172.15.0.1', false, 'below Class B range'],
      ['172.32.0.1', false, 'above Class B range'],
      ['192.168.0.1', true, 'Class C start'],
      ['192.168.255.255', true, 'Class C end'],
      ['169.254.0.1', true, 'link-local'],
      ['169.254.169.254', true, 'AWS metadata'],
      ['0.0.0.0', true, 'current network'],
      ['::1', true, 'IPv6 loopback'],
      ['fc00::1', true, 'IPv6 private fc00'],
      ['fd00::1', true, 'IPv6 private fd00'],
      ['google.com', false, 'public domain'],
      ['8.8.8.8', false, 'public DNS'],
      ['1.1.1.1', false, 'Cloudflare DNS'],
      ['example.com', false, 'example domain'],
    ] as [string, boolean, string][])('isPrivateHost(%s) → %s (%s)', (host, expected) => {
      expect(isPrivateHost(host)).toBe(expected);
    });
  });

  describe('worker handler', () => {
    const env = { ALLOWED_ORIGINS: 'https://ingglish.com,http://localhost:5173' };

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should preserve raw bytes for non-UTF-8 pages', async () => {
      // Shift_JIS encoded bytes for "テスト" (katakana "test")
      const shiftJisBytes = new Uint8Array([
        0x3c,
        0x68,
        0x74,
        0x6d,
        0x6c,
        0x3e, // <html>
        0x83,
        0x65,
        0x83,
        0x58,
        0x83,
        0x67, // テスト in Shift_JIS
        0x3c,
        0x2f,
        0x68,
        0x74,
        0x6d,
        0x6c,
        0x3e, // </html>
      ]);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(shiftJisBytes, {
          headers: { 'Content-Type': 'text/html' },
        })
      );

      const request = new Request('https://proxy.example.com/?url=https://example.jp/page.html', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(200);

      // Verify raw bytes are preserved (not decoded/re-encoded as UTF-8)
      const body = new Uint8Array(await response.arrayBuffer());
      expect(body).toEqual(shiftJisBytes);
    });

    it('should handle OPTIONS preflight with valid origin', async () => {
      const request = new Request('https://proxy.example.com/', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'OPTIONS',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://ingglish.com');
    });

    it('should reject OPTIONS preflight with invalid origin', async () => {
      const request = new Request('https://proxy.example.com/', {
        headers: { Origin: 'https://evil.com' },
        method: 'OPTIONS',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(403);
    });

    it('should reject non-GET methods', async () => {
      const request = new Request('https://proxy.example.com/', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'POST',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(405);
    });

    it('should reject requests without origin', async () => {
      const request = new Request('https://proxy.example.com/?url=https://example.com', {
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(403);
    });

    it('should reject requests with invalid origin', async () => {
      const request = new Request('https://proxy.example.com/?url=https://example.com', {
        headers: { Origin: 'https://evil.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(403);
    });

    it('should return 400 if url parameter is missing', async () => {
      const request = new Request('https://proxy.example.com/', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing url parameter');
    });

    it('should return 400 for invalid URL', async () => {
      const request = new Request('https://proxy.example.com/?url=not-a-url', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid URL');
    });

    it('should return 400 for non-http protocols', async () => {
      const request = new Request('https://proxy.example.com/?url=ftp://example.com', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid protocol');
    });

    it('should return 415 for non-HTML content that does not look like HTML', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('{"key": "value"}', {
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new Request('https://proxy.example.com/?url=https://example.com/api/data', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(415);
      const text = await response.text();
      expect(text).toContain('Only HTML content is supported');
      expect(text).toContain('application/json');
    });

    it.each([
      ['body starts with <!', '<!DOCTYPE html><html><body>Hello</body></html>', 'text/plain'],
      ['body starts with <html', '<html><body>Hello</body></html>', 'text/plain'],
      [
        'body contains <html> tag',
        'some preamble <html lang="en"><body>Hello</body></html>',
        'text/plain',
      ],
      [
        'body starts with <?',
        '<?xml version="1.0"?><html><body>Hello</body></html>',
        'application/xml',
      ],
    ] as [string, string, string][])(
      'should accept non-HTML content-type if %s',
      async (_, body, contentType) => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
          new Response(body, { headers: { 'Content-Type': contentType } })
        );

        const request = new Request('https://proxy.example.com/?url=https://example.com/page', {
          headers: { Origin: 'https://ingglish.com' },
          method: 'GET',
        });

        const response = await worker.fetch(request, env);
        expect(response.status).toBe(200);
      }
    );

    it.each([
      ['respects upstream max-age >= 5 min', 'max-age=7200', 'public, max-age=7200'],
      ['clamps upstream max-age < 5 min', 'max-age=60', 'public, max-age=300'],
      ['defaults to 1 hour when absent', undefined, 'public, max-age=3600'],
    ] as [string, string | undefined, string][])(
      'Cache-Control: %s',
      async (_, upstream, expected) => {
        const headers: Record<string, string> = { 'Content-Type': 'text/html' };
        if (upstream) {
          headers['Cache-Control'] = upstream;
        }

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
          new Response('<html><body>Hello</body></html>', { headers })
        );

        const request = new Request('https://proxy.example.com/?url=https://example.com/page', {
          headers: { Origin: 'https://ingglish.com' },
          method: 'GET',
        });

        const response = await worker.fetch(request, env);
        expect(response.headers.get('Cache-Control')).toBe(expected);
      }
    );

    it('should return 502 when upstream fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const request = new Request('https://proxy.example.com/?url=https://example.com/page', {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(502);
      expect(await response.text()).toBe('Proxy error: failed to fetch upstream resource');
    });

    it.each([
      'http://localhost/admin',
      'http://127.0.0.1/secret',
      'http://192.168.1.1/config',
      'http://10.0.0.1/internal',
      'http://169.254.169.254/latest/meta-data/',
    ])('should block SSRF request to %s', async (url) => {
      const request = new Request(`https://proxy.example.com/?url=${encodeURIComponent(url)}`, {
        headers: { Origin: 'https://ingglish.com' },
        method: 'GET',
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(403);
      expect(await response.text()).toBe('Forbidden: Private networks not allowed');
    });
  });
});
