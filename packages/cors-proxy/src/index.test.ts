import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAllowedOrigin, corsHeaders, isPrivateHost } from './index';
import worker from './index';

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
    it('should block localhost', () => {
      expect(isPrivateHost('localhost')).toBe(true);
      expect(isPrivateHost('LOCALHOST')).toBe(true);
      expect(isPrivateHost('localhost.localdomain')).toBe(true);
    });

    it('should block loopback IPs', () => {
      expect(isPrivateHost('127.0.0.1')).toBe(true);
      expect(isPrivateHost('127.0.0.255')).toBe(true);
      expect(isPrivateHost('127.255.255.255')).toBe(true);
    });

    it('should block Class A private range (10.x.x.x)', () => {
      expect(isPrivateHost('10.0.0.1')).toBe(true);
      expect(isPrivateHost('10.255.255.255')).toBe(true);
    });

    it('should block Class B private range (172.16-31.x.x)', () => {
      expect(isPrivateHost('172.16.0.1')).toBe(true);
      expect(isPrivateHost('172.31.255.255')).toBe(true);
      // Outside range should be allowed
      expect(isPrivateHost('172.15.0.1')).toBe(false);
      expect(isPrivateHost('172.32.0.1')).toBe(false);
    });

    it('should block Class C private range (192.168.x.x)', () => {
      expect(isPrivateHost('192.168.0.1')).toBe(true);
      expect(isPrivateHost('192.168.255.255')).toBe(true);
    });

    it('should block link-local addresses (169.254.x.x)', () => {
      expect(isPrivateHost('169.254.0.1')).toBe(true);
      expect(isPrivateHost('169.254.169.254')).toBe(true); // AWS metadata
    });

    it('should block current network (0.x.x.x)', () => {
      expect(isPrivateHost('0.0.0.0')).toBe(true);
    });

    it('should block IPv6 loopback and private', () => {
      expect(isPrivateHost('::1')).toBe(true);
      expect(isPrivateHost('fc00::1')).toBe(true);
      expect(isPrivateHost('fd00::1')).toBe(true);
    });

    it('should allow public hosts', () => {
      expect(isPrivateHost('google.com')).toBe(false);
      expect(isPrivateHost('8.8.8.8')).toBe(false);
      expect(isPrivateHost('1.1.1.1')).toBe(false);
      expect(isPrivateHost('example.com')).toBe(false);
    });
  });

  describe('worker handler', () => {
    const env = { ALLOWED_ORIGINS: 'https://ingglish.com,http://localhost:5173' };

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle OPTIONS preflight with valid origin', async () => {
      const request = new Request('https://proxy.example.com/', {
        method: 'OPTIONS',
        headers: { Origin: 'https://ingglish.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://ingglish.com');
    });

    it('should reject OPTIONS preflight with invalid origin', async () => {
      const request = new Request('https://proxy.example.com/', {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(403);
    });

    it('should reject non-GET methods', async () => {
      const request = new Request('https://proxy.example.com/', {
        method: 'POST',
        headers: { Origin: 'https://ingglish.com' },
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
        method: 'GET',
        headers: { Origin: 'https://evil.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(403);
    });

    it('should return 400 if url parameter is missing', async () => {
      const request = new Request('https://proxy.example.com/', {
        method: 'GET',
        headers: { Origin: 'https://ingglish.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing url parameter');
    });

    it('should return 400 for invalid URL', async () => {
      const request = new Request('https://proxy.example.com/?url=not-a-url', {
        method: 'GET',
        headers: { Origin: 'https://ingglish.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid URL');
    });

    it('should return 400 for non-http protocols', async () => {
      const request = new Request('https://proxy.example.com/?url=ftp://example.com', {
        method: 'GET',
        headers: { Origin: 'https://ingglish.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid protocol');
    });

    it('should block requests to private networks (SSRF protection)', async () => {
      const privateUrls = [
        'http://localhost/admin',
        'http://127.0.0.1/secret',
        'http://192.168.1.1/config',
        'http://10.0.0.1/internal',
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
      ];

      for (const url of privateUrls) {
        const request = new Request(`https://proxy.example.com/?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: { Origin: 'https://ingglish.com' },
        });

        const response = await worker.fetch(request, env);
        expect(response.status).toBe(403);
        expect(await response.text()).toBe('Forbidden: Private networks not allowed');
      }
    });
  });
});
