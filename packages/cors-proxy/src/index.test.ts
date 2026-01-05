import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isAllowedOrigin, corsHeaders } from './index';
import worker from './index';

describe('cors-proxy', () => {
  describe('isAllowedOrigin', () => {
    const allowedOrigins = 'https://paultarjan.com,http://localhost:5173';

    it('should allow exact match', () => {
      expect(isAllowedOrigin('https://paultarjan.com', allowedOrigins)).toBe(true);
      expect(isAllowedOrigin('http://localhost:5173', allowedOrigins)).toBe(true);
    });

    it('should reject non-matching origins', () => {
      expect(isAllowedOrigin('https://evil.com', allowedOrigins)).toBe(false);
      expect(isAllowedOrigin('https://paultarjan.com.evil.com', allowedOrigins)).toBe(false);
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

  describe('worker handler', () => {
    const env = { ALLOWED_ORIGINS: 'https://paultarjan.com,http://localhost:5173' };

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should handle OPTIONS preflight with valid origin', async () => {
      const request = new Request('https://proxy.example.com/', {
        method: 'OPTIONS',
        headers: { Origin: 'https://paultarjan.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://paultarjan.com');
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
        headers: { Origin: 'https://paultarjan.com' },
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
        headers: { Origin: 'https://paultarjan.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Missing url parameter');
    });

    it('should return 400 for invalid URL', async () => {
      const request = new Request('https://proxy.example.com/?url=not-a-url', {
        method: 'GET',
        headers: { Origin: 'https://paultarjan.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid URL');
    });

    it('should return 400 for non-http protocols', async () => {
      const request = new Request('https://proxy.example.com/?url=ftp://example.com', {
        method: 'GET',
        headers: { Origin: 'https://paultarjan.com' },
      });

      const response = await worker.fetch(request, env);
      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid protocol');
    });
  });
});
