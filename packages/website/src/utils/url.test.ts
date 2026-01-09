import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  shouldSkipUrl,
  injectBaseTag,
  getBaseUrl,
  detectBotProtection,
  stripScripts,
  proxyFontUrls,
} from './url';

describe('normalizeUrl', () => {
  it('returns null for empty string', () => {
    expect(normalizeUrl('')).toBe(null);
  });

  it('returns null for whitespace only', () => {
    expect(normalizeUrl('   ')).toBe(null);
    expect(normalizeUrl('\t\n')).toBe(null);
  });

  it('adds https:// prefix when missing', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
    expect(normalizeUrl('www.example.com')).toBe('https://www.example.com');
  });

  it('preserves http:// prefix', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('preserves https:// prefix', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns null for invalid URLs', () => {
    expect(normalizeUrl('not a valid url')).toBe(null);
    expect(normalizeUrl('://missing-protocol')).toBe(null);
  });

  it('handles URLs with paths and query strings', () => {
    expect(normalizeUrl('example.com/path?query=1')).toBe('https://example.com/path?query=1');
  });

  it('handles URLs with ports', () => {
    expect(normalizeUrl('localhost:3000')).toBe('https://localhost:3000');
  });
});

describe('shouldSkipUrl', () => {
  it('skips hash links', () => {
    expect(shouldSkipUrl('#')).toBe(true);
    expect(shouldSkipUrl('#section')).toBe(true);
    expect(shouldSkipUrl('#top')).toBe(true);
  });

  it('skips javascript: URLs', () => {
    expect(shouldSkipUrl('javascript:void(0)')).toBe(true);
    expect(shouldSkipUrl('javascript:alert("hi")')).toBe(true);
  });

  it('skips mailto: URLs', () => {
    expect(shouldSkipUrl('mailto:test@example.com')).toBe(true);
    expect(shouldSkipUrl('mailto:user@domain.org?subject=Hello')).toBe(true);
  });

  it('does not skip regular URLs', () => {
    expect(shouldSkipUrl('https://example.com')).toBe(false);
    expect(shouldSkipUrl('http://example.com')).toBe(false);
    expect(shouldSkipUrl('/relative/path')).toBe(false);
    expect(shouldSkipUrl('relative/path')).toBe(false);
  });

  it('does not skip tel: URLs (not in skip list)', () => {
    expect(shouldSkipUrl('tel:+1234567890')).toBe(false);
  });
});

describe('getBaseUrl', () => {
  it('handles URLs ending with slash', () => {
    expect(getBaseUrl('https://example.com/')).toBe('https://example.com/');
    expect(getBaseUrl('https://example.com/path/')).toBe('https://example.com/path/');
    expect(getBaseUrl('https://example.com/deep/path/')).toBe('https://example.com/deep/path/');
  });

  it('handles URLs with filenames', () => {
    expect(getBaseUrl('https://example.com/page.html')).toBe('https://example.com/');
    expect(getBaseUrl('https://example.com/path/page.html')).toBe('https://example.com/path/');
    expect(getBaseUrl('https://example.com/deep/path/index.php')).toBe(
      'https://example.com/deep/path/'
    );
  });

  it('handles URLs without extension as directories', () => {
    expect(getBaseUrl('https://example.com/nerdiversary')).toBe(
      'https://example.com/nerdiversary/'
    );
    expect(getBaseUrl('https://example.com/path/segment')).toBe(
      'https://example.com/path/segment/'
    );
  });

  it('handles root URLs', () => {
    expect(getBaseUrl('https://example.com')).toBe('https://example.com/');
  });

  it('handles URLs with ports', () => {
    expect(getBaseUrl('http://localhost:3000/path/')).toBe('http://localhost:3000/path/');
    expect(getBaseUrl('http://localhost:3000/page.html')).toBe('http://localhost:3000/');
  });
});

describe('injectBaseTag', () => {
  const baseUrl = 'https://example.com/path/';

  it('injects base tag after <head> when present', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>';
    const result = injectBaseTag(html, baseUrl);
    expect(result).toBe(
      '<html><head><base href="https://example.com/path/"><title>Test</title></head><body></body></html>'
    );
  });

  it('creates head and injects base tag when only <html> is present', () => {
    const html = '<html><body>Content</body></html>';
    const result = injectBaseTag(html, baseUrl);
    expect(result).toBe(
      '<html><head><base href="https://example.com/path/"></head><body>Content</body></html>'
    );
  });

  it('prepends base tag when no html or head tags present', () => {
    const html = '<body>Content</body>';
    const result = injectBaseTag(html, baseUrl);
    expect(result).toBe('<base href="https://example.com/path/"><body>Content</body>');
  });

  it('handles empty HTML', () => {
    const html = '';
    const result = injectBaseTag(html, baseUrl);
    expect(result).toBe('<base href="https://example.com/path/">');
  });

  it('handles HTML with uppercase tags', () => {
    // Note: current implementation is case-sensitive
    const html = '<HTML><HEAD></HEAD></HTML>';
    const result = injectBaseTag(html, baseUrl);
    // Since it looks for lowercase, it prepends
    expect(result).toBe('<base href="https://example.com/path/"><HTML><HEAD></HEAD></HTML>');
  });

  it('handles base URL with port', () => {
    const html = '<html><head></head></html>';
    const result = injectBaseTag(html, 'http://localhost:3000/');
    expect(result).toContain('href="http://localhost:3000/"');
  });
});

describe('detectBotProtection', () => {
  it('returns null for normal HTML', () => {
    const html = '<html><head><title>Test</title></head><body>Hello world</body></html>';
    expect(detectBotProtection(html)).toBe(null);
  });

  it('detects Cloudflare challenge pages', () => {
    const html =
      '<html><head><title>Just a moment...</title></head><script>window._cf_chl_opt={}</script></html>';
    expect(detectBotProtection(html)).toContain('Cloudflare protection');
  });

  it('detects Cloudflare challenge-platform scripts', () => {
    const html = '<script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>';
    expect(detectBotProtection(html)).toContain('Cloudflare protection');
  });

  it('detects Cloudflare block pages', () => {
    const html = '<h1>Sorry, you have been blocked</h1><p>You are unable to access example.com</p>';
    expect(detectBotProtection(html)).toContain('blocked');
  });

  it('detects Cloudflare attention required pages', () => {
    const html = '<title>Attention Required! | Cloudflare</title>';
    expect(detectBotProtection(html)).toContain('blocked');
  });

  it('detects JavaScript verification pages', () => {
    const html = "<p>JavaScript is disabled</p><p>we need to verify that you're not a robot</p>";
    expect(detectBotProtection(html)).toContain('JavaScript verification');
  });

  it('detects enable JavaScript continue pages', () => {
    const html = '<p>Please enable JavaScript and cookies to continue</p>';
    expect(detectBotProtection(html)).toContain('JavaScript verification');
  });

  it('is case insensitive', () => {
    const html = '<H1>SORRY, YOU HAVE BEEN BLOCKED</H1>';
    expect(detectBotProtection(html)).toContain('blocked');
  });
});

describe('stripScripts', () => {
  it('removes script tags with content', () => {
    const html = '<html><head><script>alert("hi")</script></head><body>Hello</body></html>';
    expect(stripScripts(html)).toBe('<html><head></head><body>Hello</body></html>');
  });

  it('removes multiple script tags', () => {
    const html = '<script>a</script><p>text</p><script>b</script>';
    expect(stripScripts(html)).toBe('<p>text</p>');
  });

  it('removes script tags with attributes', () => {
    const html = '<script type="text/javascript" src="app.js"></script>';
    expect(stripScripts(html)).toBe('');
  });

  it('removes self-closing script tags', () => {
    const html = '<script src="app.js"/><p>content</p>';
    expect(stripScripts(html)).toBe('<p>content</p>');
  });

  it('handles multiline script content', () => {
    const html = `<script>
      function test() {
        return 1;
      }
    </script><p>text</p>`;
    expect(stripScripts(html)).toBe('<p>text</p>');
  });

  it('is case insensitive', () => {
    const html = '<SCRIPT>code</SCRIPT><Script>more</Script>';
    expect(stripScripts(html)).toBe('');
  });

  it('preserves other content', () => {
    const html = '<html><head><title>Test</title></head><body><p>Hello</p></body></html>';
    expect(stripScripts(html)).toBe(html);
  });
});

describe('proxyFontUrls', () => {
  const proxy = 'https://proxy.example.com/?url=';

  it('proxies woff2 font URLs', () => {
    const css = 'url(https://example.com/font.woff2)';
    const result = proxyFontUrls(css, proxy);
    expect(result).toBe(`url(${proxy}${encodeURIComponent('https://example.com/font.woff2')})`);
  });

  it('proxies woff font URLs', () => {
    const css = "url('https://example.com/font.woff')";
    const result = proxyFontUrls(css, proxy);
    expect(result).toBe(`url('${proxy}${encodeURIComponent('https://example.com/font.woff')}')`);
  });

  it('proxies ttf font URLs', () => {
    const css = 'url("https://example.com/font.ttf")';
    const result = proxyFontUrls(css, proxy);
    expect(result).toBe(`url("${proxy}${encodeURIComponent('https://example.com/font.ttf')}")`);
  });

  it('proxies font URLs with query strings', () => {
    const css = 'url(https://example.com/font.woff2?v=4.4.0)';
    const result = proxyFontUrls(css, proxy);
    expect(result).toBe(
      `url(${proxy}${encodeURIComponent('https://example.com/font.woff2?v=4.4.0')})`
    );
  });

  it('does not proxy image URLs', () => {
    const css = 'url(https://example.com/image.png)';
    expect(proxyFontUrls(css, proxy)).toBe(css);
  });

  it('does not proxy relative URLs', () => {
    const css = 'url(fonts/font.woff2)';
    expect(proxyFontUrls(css, proxy)).toBe(css);
  });

  it('handles multiple font URLs', () => {
    const css = `
      @font-face {
        src: url(https://a.com/font.woff2),
             url(https://b.com/font.woff);
      }
    `;
    const result = proxyFontUrls(css, proxy);
    expect(result).toContain(`${proxy}${encodeURIComponent('https://a.com/font.woff2')}`);
    expect(result).toContain(`${proxy}${encodeURIComponent('https://b.com/font.woff')}`);
  });
});
