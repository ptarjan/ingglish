import { describe, expect, it } from 'vitest';
import {
  decodeHtmlBuffer,
  decodeResponse,
  detectBotProtection,
  detectCharsetFromHeader,
  normalizeCharsetToUtf8,
  escapeHtmlAttr,
  extractBaseHref,
  extractCanonicalUrl,
  getBaseUrl,
  injectBaseTag,
  isHashOnlyChange,
  normalizeUrl,
  processProxiedHtml,
  proxyFontUrls,
  shouldSkipUrl,
  stripScripts,
} from '.';

/** Encode a UTF-8 string to an ArrayBuffer. */
function encodeUtf8(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer;
}

describe('decodeHtmlBuffer', () => {
  it('decodes UTF-8 by default', () => {
    const html = '<html><body>Hello</body></html>';
    expect(decodeHtmlBuffer(encodeUtf8(html))).toBe(html);
  });

  it('detects charset from XML declaration', () => {
    // Shift_JIS bytes for こんにちは
    const prefix = '<?xml version="1.0" encoding="Shift_JIS"?>\n<html><body>';
    const suffix = '</body></html>';
    const jpBytes = new Uint8Array([0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd]);
    const prefixBytes = new TextEncoder().encode(prefix);
    const suffixBytes = new TextEncoder().encode(suffix);
    const combined = new Uint8Array(prefixBytes.length + jpBytes.length + suffixBytes.length);
    combined.set(prefixBytes, 0);
    combined.set(jpBytes, prefixBytes.length);
    combined.set(suffixBytes, prefixBytes.length + jpBytes.length);

    const result = decodeHtmlBuffer(combined.buffer);
    expect(result).toContain('こんにちは');
  });

  it('detects charset from meta charset tag', () => {
    const prefix = '<html><head><meta charset="Shift_JIS"></head><body>';
    const suffix = '</body></html>';
    const jpBytes = new Uint8Array([0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd]);
    const prefixBytes = new TextEncoder().encode(prefix);
    const suffixBytes = new TextEncoder().encode(suffix);
    const combined = new Uint8Array(prefixBytes.length + jpBytes.length + suffixBytes.length);
    combined.set(prefixBytes, 0);
    combined.set(jpBytes, prefixBytes.length);
    combined.set(suffixBytes, prefixBytes.length + jpBytes.length);

    const result = decodeHtmlBuffer(combined.buffer);
    expect(result).toContain('こんにちは');
  });

  it('detects charset from http-equiv Content-Type', () => {
    const prefix =
      '<html><head><meta http-equiv="Content-Type" content="text/html;charset=Shift_JIS"></head><body>';
    const suffix = '</body></html>';
    const jpBytes = new Uint8Array([0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd]);
    const prefixBytes = new TextEncoder().encode(prefix);
    const suffixBytes = new TextEncoder().encode(suffix);
    const combined = new Uint8Array(prefixBytes.length + jpBytes.length + suffixBytes.length);
    combined.set(prefixBytes, 0);
    combined.set(jpBytes, prefixBytes.length);
    combined.set(suffixBytes, prefixBytes.length + jpBytes.length);

    const result = decodeHtmlBuffer(combined.buffer);
    expect(result).toContain('こんにちは');
  });
});

describe('normalizeCharsetToUtf8', () => {
  it('removes XML declaration with encoding', () => {
    const html = '<?xml version="1.0" encoding="Shift_JIS"?>\n<html><body>test</body></html>';
    const result = normalizeCharsetToUtf8(html);
    expect(result).not.toContain('<?xml');
    expect(result).toContain('<html>');
  });

  it('replaces meta charset', () => {
    const html = '<html><head><meta charset="Shift_JIS"></head><body>test</body></html>';
    const result = normalizeCharsetToUtf8(html);
    expect(result).toContain('charset="utf-8"');
    expect(result).not.toContain('Shift_JIS');
  });

  it('replaces http-equiv Content-Type charset', () => {
    const html =
      '<html><head><meta http-equiv="Content-Type" content="text/html;charset=Shift_JIS"></head></html>';
    const result = normalizeCharsetToUtf8(html);
    expect(result).toContain('charset=utf-8');
    expect(result).not.toContain('Shift_JIS');
  });

  it('leaves UTF-8 pages unchanged (except casing)', () => {
    const html = '<html><head><meta charset="UTF-8"></head><body>test</body></html>';
    const result = normalizeCharsetToUtf8(html);
    expect(result).toContain('charset="utf-8"');
  });

  it('handles page with no charset declarations', () => {
    const html = '<html><body>hello</body></html>';
    expect(normalizeCharsetToUtf8(html)).toBe(html);
  });
});

describe('escapeHtmlAttr', () => {
  it.each([
    ['ampersands', 'a&b', 'a&amp;b'],
    ['double quotes', 'a"b', 'a&quot;b'],
    ['single quotes', "a'b", 'a&#39;b'],
    ['less than', 'a<b', 'a&lt;b'],
    ['greater than', 'a>b', 'a&gt;b'],
    [
      'multiple special characters',
      '<script>"alert(\'xss\')"</script>',
      '&lt;script&gt;&quot;alert(&#39;xss&#39;)&quot;&lt;/script&gt;',
    ],
    [
      'URLs with query parameters',
      'https://example.com?a=1&b=2',
      'https://example.com?a=1&amp;b=2',
    ],
    ['empty string unchanged', '', ''],
    ['safe strings unchanged', 'https://example.com/path', 'https://example.com/path'],
  ])('escapes %s', (_label, input, expected) => {
    expect(escapeHtmlAttr(input)).toBe(expected);
  });
});

describe('normalizeUrl', () => {
  it.each([
    ['empty string', '', null],
    ['whitespace only (spaces)', '   ', null],
    ['whitespace only (tab+newline)', '\t\n', null],
    ['bare domain', 'example.com', 'https://example.com'],
    ['www domain', 'www.example.com', 'https://www.example.com'],
    ['http:// prefix', 'http://example.com', 'http://example.com'],
    ['https:// prefix', 'https://example.com', 'https://example.com'],
    ['invalid URL (spaces)', 'not a valid url', null],
    ['invalid URL (missing protocol)', '://missing-protocol', null],
    ['URL with path and query', 'example.com/path?query=1', 'https://example.com/path?query=1'],
    ['URL with port', 'localhost:3000', 'https://localhost:3000'],
  ])('normalizes %s', (_label, input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });
});

describe('shouldSkipUrl', () => {
  it.each([
    ['hash link #', '#', true],
    ['hash link #section', '#section', true],
    ['hash link #top', '#top', true],
    ['javascript:void(0)', 'javascript:void(0)', true],
    ['javascript:alert("hi")', 'javascript:alert("hi")', true],
    ['mailto:test@example.com', 'mailto:test@example.com', true],
    ['mailto with subject', 'mailto:user@domain.org?subject=Hello', true],
    ['https URL', 'https://example.com', false],
    ['http URL', 'http://example.com', false],
    ['absolute relative path', '/relative/path', false],
    ['relative path', 'relative/path', false],
    ['tel: URL (not in skip list)', 'tel:+1234567890', false],
  ])('returns expected for %s', (_label, url, expected) => {
    expect(shouldSkipUrl(url)).toBe(expected);
  });
});

describe('getBaseUrl', () => {
  it.each([
    ['trailing slash (root)', 'https://example.com/', 'https://example.com/'],
    ['trailing slash (one segment)', 'https://example.com/path/', 'https://example.com/path/'],
    [
      'trailing slash (deep path)',
      'https://example.com/deep/path/',
      'https://example.com/deep/path/',
    ],
    ['filename at root', 'https://example.com/page.html', 'https://example.com/'],
    ['filename in path', 'https://example.com/path/page.html', 'https://example.com/path/'],
    [
      'filename deep path',
      'https://example.com/deep/path/index.php',
      'https://example.com/deep/path/',
    ],
    ['no extension (root segment)', 'https://example.com/nerdiversary', 'https://example.com/'],
    [
      'no extension (nested segment)',
      'https://example.com/path/segment',
      'https://example.com/path/',
    ],
    [
      'HN-style query URL',
      'https://news.ycombinator.com/item?id=47025011',
      'https://news.ycombinator.com/',
    ],
    ['root URL without trailing slash', 'https://example.com', 'https://example.com/'],
    ['port with trailing slash', 'http://localhost:3000/path/', 'http://localhost:3000/path/'],
    ['port with filename', 'http://localhost:3000/page.html', 'http://localhost:3000/'],
  ])('handles %s', (_label, input, expected) => {
    expect(getBaseUrl(input)).toBe(expected);
  });
});

describe('extractBaseHref', () => {
  it.each([
    [
      'double-quoted href',
      '<head><base href="https://example.com/"></head>',
      'https://example.com/',
    ],
    [
      'single-quoted href',
      "<head><base href='https://example.com/'></head>",
      'https://example.com/',
    ],
    ['self-closing base tag', '<base href="https://example.com/" />', 'https://example.com/'],
    ['uppercase BASE HREF', '<BASE HREF="https://example.com/">', 'https://example.com/'],
    ['no base tag', '<head><title>Test</title></head>', null],
    ['empty HTML', '', null],
  ])('extracts from %s', (_label, html, expected) => {
    if (expected === null) {
      expect(extractBaseHref(html)).toBeNull();
    } else {
      expect(extractBaseHref(html)).toBe(expected);
    }
  });
});

describe('extractCanonicalUrl', () => {
  it.each([
    [
      'link rel=canonical',
      '<link rel="canonical" href="https://example.com/page">',
      'https://example.com/page',
    ],
    [
      'href before rel',
      '<link href="https://example.com/page" rel="canonical">',
      'https://example.com/page',
    ],
    [
      'og:url meta tag',
      '<meta property="og:url" content="https://example.com/page">',
      'https://example.com/page',
    ],
    [
      'og:url with content before property',
      '<meta content="https://example.com/page" property="og:url">',
      'https://example.com/page',
    ],
    [
      'canonical over og:url',
      '<link rel="canonical" href="https://a.com/"><meta property="og:url" content="https://b.com/">',
      'https://a.com/',
    ],
    ['no canonical info', '<head><title>Test</title></head>', null],
    ['empty HTML', '', null],
  ])('extracts from %s', (_label, html, expected) => {
    if (expected === null) {
      expect(extractCanonicalUrl(html)).toBeNull();
    } else {
      expect(extractCanonicalUrl(html)).toBe(expected);
    }
  });
});

describe('injectBaseTag', () => {
  const baseUrl = 'https://example.com/path/';

  it.each([
    [
      '<head> present',
      '<html><head><title>Test</title></head><body></body></html>',
      '<html><head><base href="https://example.com/path/"><title>Test</title></head><body></body></html>',
    ],
    [
      'only <html> present',
      '<html><body>Content</body></html>',
      '<html><head><base href="https://example.com/path/"></head><body>Content</body></html>',
    ],
    [
      'no html or head tags',
      '<body>Content</body>',
      '<base href="https://example.com/path/"><body>Content</body>',
    ],
    ['empty HTML', '', '<base href="https://example.com/path/">'],
    [
      'uppercase tags (case-sensitive)',
      '<HTML><HEAD></HEAD></HTML>',
      '<base href="https://example.com/path/"><HTML><HEAD></HEAD></HTML>',
    ],
  ])('injects base tag when %s', (_label, html, expected) => {
    expect(injectBaseTag(html, baseUrl)).toBe(expected);
  });

  it('handles base URL with port', () => {
    const html = '<html><head></head></html>';
    const result = injectBaseTag(html, 'http://localhost:3000/');
    expect(result).toContain('href="http://localhost:3000/"');
  });

  it('does not inject when HTML already has a base tag', () => {
    const html = '<html><head><base href="https://original.com/"></head><body></body></html>';
    const result = injectBaseTag(html, baseUrl);
    expect(result).toBe(html);
    expect(result).not.toContain('example.com');
  });
});

describe('isHashOnlyChange', () => {
  it.each([
    [
      'same URL with added hash',
      'https://example.com/page',
      'https://example.com/page#section',
      true,
    ],
    [
      'hash changes from one to another',
      'https://example.com/page#one',
      'https://example.com/page#two',
      true,
    ],
    [
      'trailing slash added with hash (Wikipedia-style)',
      'https://en.wikipedia.org/wiki/English_language',
      'https://en.wikipedia.org/wiki/English_language/#History',
      true,
    ],
    [
      'trailing slash removed with hash (Wikipedia-style)',
      'https://en.wikipedia.org/wiki/English_language/',
      'https://en.wikipedia.org/wiki/English_language#History',
      true,
    ],
    ['different paths', 'https://example.com/page-a', 'https://example.com/page-b#section', false],
    ['different origins', 'https://example.com/page', 'https://other.com/page#section', false],
    ['new URL has no hash', 'https://example.com/page#section', 'https://example.com/page', false],
    [
      'different query strings',
      'https://example.com/page?a=1',
      'https://example.com/page?b=2#section',
      false,
    ],
    ['invalid current URL', 'not a url', 'https://example.com#section', false],
    ['invalid new URL', 'https://example.com', 'not a url', false],
  ])('returns expected for %s', (_label, currentUrl, newUrl, expected) => {
    expect(isHashOnlyChange(currentUrl, newUrl)).toBe(expected);
  });
});

describe('detectBotProtection', () => {
  it('returns null for normal HTML', () => {
    const html = '<html><head><title>Test</title></head><body>Hello world</body></html>';
    expect(detectBotProtection(html)).toBe(null);
  });

  it.each([
    [
      'Cloudflare challenge page',
      '<html><head><title>Just a moment...</title></head><script>window._cf_chl_opt={}</script></html>',
      'Cloudflare protection',
    ],
    [
      'Cloudflare challenge-platform script',
      '<script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>',
      'Cloudflare protection',
    ],
    [
      'Cloudflare block page',
      '<h1>Sorry, you have been blocked</h1><p>You are unable to access example.com</p>',
      'blocked',
    ],
    ['Cloudflare attention required', '<title>Attention Required! | Cloudflare</title>', 'blocked'],
    [
      'JavaScript verification page',
      "<p>JavaScript is disabled</p><p>we need to verify that you're not a robot</p>",
      'JavaScript verification',
    ],
    [
      'enable JavaScript continue page',
      '<p>Please enable JavaScript and cookies to continue</p>',
      'JavaScript verification',
    ],
    ['case-insensitive block detection', '<H1>SORRY, YOU HAVE BEEN BLOCKED</H1>', 'blocked'],
  ])('detects %s', (_label, html, expectedContains) => {
    expect(detectBotProtection(html)).toContain(expectedContains);
  });
});

describe('stripScripts', () => {
  it.each([
    [
      'script tags with content',
      '<html><head><script>alert("hi")</script></head><body>Hello</body></html>',
      '<html><head></head><body>Hello</body></html>',
    ],
    ['multiple script tags', '<script>a</script><p>text</p><script>b</script>', '<p>text</p>'],
    ['script tags with attributes', '<script type="text/javascript" src="app.js"></script>', ''],
    ['self-closing script tags', '<script src="app.js"/><p>content</p>', '<p>content</p>'],
    ['case-insensitive script tags', '<SCRIPT>code</SCRIPT><Script>more</Script>', ''],
    [
      'preserves non-script content',
      '<html><head><title>Test</title></head><body><p>Hello</p></body></html>',
      '<html><head><title>Test</title></head><body><p>Hello</p></body></html>',
    ],
  ])('removes %s', (_label, html, expected) => {
    expect(stripScripts(html)).toBe(expected);
  });

  it('handles multiline script content', () => {
    const html = `<script>
      function test() {
        return 1;
      }
    </script><p>text</p>`;
    expect(stripScripts(html)).toBe('<p>text</p>');
  });
});

describe('stripScripts — SVG/math vectors', () => {
  it('strips script inside SVG', () => {
    const html = '<p>hello</p><svg><script>alert(1)</script></svg>';
    const result = stripScripts(html);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('hello');
  });

  it('strips script inside math element', () => {
    const html = '<p>hello</p><math><script>alert(1)</script></math>';
    const result = stripScripts(html);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('hello');
  });

  it('strips mXSS-style nested template payload', () => {
    // Typical mXSS vector: script hidden inside nesting
    const html = '<p>safe</p><noscript><p title="</noscript><script>alert(1)</script>">';
    const result = stripScripts(html);
    expect(result).not.toContain('alert(1)');
    expect(result).toContain('safe');
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

describe('processProxiedHtml', () => {
  const options = {
    pageUrl: 'https://example.com/path/page.html',
    proxyUrl: 'https://proxy.example.com/?url=',
  };

  it('processes HTML through the full pipeline', () => {
    const html = '<html><head></head><body><p>Hello</p></body></html>';
    const result = processProxiedHtml(html, options);

    expect(result.baseUrl).toBe('https://example.com/path/');
    expect(result.html).toContain('<base href="https://example.com/path/">');
    expect(result.html).toContain('ingglish-link-click');
  });

  it('throws for bot protection pages', () => {
    const html = '<html><script>window._cf_chl_opt={}</script></html>';
    expect(() => processProxiedHtml(html, options)).toThrow('Cloudflare protection');
  });

  it('strips scripts from HTML', () => {
    const html = '<html><head><script>alert(1)</script></head><body>Content</body></html>';
    const result = processProxiedHtml(html, options);

    // Should not contain the alert script
    expect(result.html).not.toContain('alert(1)');
    // But should contain the click handler script
    expect(result.html).toContain('ingglish-link-click');
  });

  it('proxies font URLs', () => {
    const html =
      '<html><head><style>@font-face { src: url(https://fonts.example.com/font.woff2); }</style></head><body></body></html>';
    const result = processProxiedHtml(html, options);

    expect(result.html).toContain(
      `${options.proxyUrl}${encodeURIComponent('https://fonts.example.com/font.woff2')}`
    );
  });

  it('injects click handler before </body>', () => {
    const html = '<html><body><p>Test</p></body></html>';
    const result = processProxiedHtml(html, options);

    expect(result.html).toMatch(/ingglish-link-click.*<\/body>/s);
  });

  it('injects click handler before </html> if no body tag', () => {
    const html = '<html><p>Test</p></html>';
    const result = processProxiedHtml(html, options);

    expect(result.html).toMatch(/ingglish-link-click.*<\/html>/s);
  });

  it('appends click handler if no body or html closing tags', () => {
    const html = '<p>Test</p>';
    const result = processProxiedHtml(html, options);

    expect(result.html).toContain('ingglish-link-click');
  });

  it('injects CSP meta tag with nonce', () => {
    const html = '<html><head></head><body><p>Test</p></body></html>';
    const result = processProxiedHtml(html, options);

    expect(result.html).toContain('http-equiv="Content-Security-Policy"');
    expect(result.html).toMatch(/script-src 'nonce-[a-f0-9]+'/);
  });

  it('click handler script has matching nonce attribute', () => {
    const html = '<html><head></head><body><p>Test</p></body></html>';
    const result = processProxiedHtml(html, options);

    // Extract nonce from CSP meta tag
    const cspMatch = /nonce-([a-f0-9]+)/.exec(result.html);
    expect(cspMatch).not.toBeNull();
    const nonce = cspMatch![1];

    // Click handler script should have the same nonce
    expect(result.html).toContain(`<script nonce="${nonce}">`);
    expect(result.html).toContain('ingglish-link-click');
  });

  it('generates unique nonces per invocation', () => {
    const html = '<html><head></head><body></body></html>';
    const result1 = processProxiedHtml(html, options);
    const result2 = processProxiedHtml(html, options);

    const nonce1 = /nonce-([a-f0-9]+)/.exec(result1.html)![1];
    const nonce2 = /nonce-([a-f0-9]+)/.exec(result2.html)![1];
    expect(nonce1).not.toBe(nonce2);
  });

  it('returns correct base URL for different page paths', () => {
    const result1 = processProxiedHtml('<html></html>', {
      ...options,
      pageUrl: 'https://example.com/',
    });
    expect(result1.baseUrl).toBe('https://example.com/');

    const result2 = processProxiedHtml('<html></html>', {
      ...options,
      pageUrl: 'https://example.com/deep/path/file.html',
    });
    expect(result2.baseUrl).toBe('https://example.com/deep/path/');
  });

  it('uses existing base tag href instead of computing from page URL', () => {
    const html =
      '<html><head><base href="https://fleursdumal.org/" /></head><body><img src="images/photo.jpg"></body></html>';
    const result = processProxiedHtml(html, {
      ...options,
      pageUrl: 'https://fleursdumal.org/poem/148',
    });

    // Should use the page's own base href, not /poem/
    expect(result.baseUrl).toBe('https://fleursdumal.org/');
    // Should NOT inject a second base tag
    expect(result.html.match(/<base /gi)?.length).toBe(1);
  });

  it('uses canonical URL for base when page URL differs (redirect case)', () => {
    // Simulates a CORS proxy silently following a 301 redirect:
    // original URL: old-domain.com/old-path/123
    // actual page: new-domain.com/new-path/123.html (with canonical tag)
    const html =
      '<html><head><link rel="canonical" href="https://new-domain.com/new-path/123.html"></head><body><link rel="stylesheet" href="style.css"></body></html>';
    const result = processProxiedHtml(html, {
      ...options,
      pageUrl: 'https://old-domain.com/old-path/123',
    });

    // Should use canonical URL's directory, not the original URL's
    expect(result.baseUrl).toBe('https://new-domain.com/new-path/');
  });

  it('uses og:url for base when canonical is not present', () => {
    const html =
      '<html><head><meta property="og:url" content="https://real-site.com/articles/page.html"></head><body></body></html>';
    const result = processProxiedHtml(html, {
      ...options,
      pageUrl: 'https://proxy-saw-this.com/redirect/page',
    });

    expect(result.baseUrl).toBe('https://real-site.com/articles/');
  });
});

describe('detectCharsetFromHeader', () => {
  it('returns null when no Content-Type header', () => {
    // Response() sets a default Content-Type, so build one without it
    const response = new Response(null, { status: 200 });
    response.headers.delete('content-type');
    expect(detectCharsetFromHeader(response)).toBeNull();
  });

  it('returns null when no charset in Content-Type', () => {
    const response = new Response('', {
      headers: { 'Content-Type': 'text/html' },
    });
    expect(detectCharsetFromHeader(response)).toBeNull();
  });

  it.each([
    ['standard charset', 'text/html; charset=Shift_JIS', 'Shift_JIS'],
    ['quoted charset', 'text/html; charset="EUC-JP"', 'EUC-JP'],
    ['case-insensitive Charset', 'text/html; Charset=ISO-8859-1', 'ISO-8859-1'],
  ])('extracts %s from Content-Type header', (_label, contentType, expected) => {
    const response = new Response('', {
      headers: { 'Content-Type': contentType },
    });
    expect(detectCharsetFromHeader(response)).toBe(expected);
  });
});

describe('decodeResponse', () => {
  it('uses Content-Type header charset when available', async () => {
    const metaPart = new TextEncoder().encode('<html><body>');
    const sjisBytes = new Uint8Array([0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd]);
    const endPart = new TextEncoder().encode('</body></html>');
    const body = new Uint8Array([...metaPart, ...sjisBytes, ...endPart]);

    const response = new Response(body, {
      headers: { 'Content-Type': 'text/html; charset=Shift_JIS' },
    });

    const result = await decodeResponse(response);
    expect(result).toContain('こんにちは');
  });

  it('falls back to byte-level detection when no header charset', async () => {
    const metaPart = new TextEncoder().encode(
      '<html><head><meta charset="Shift_JIS"></head><body>'
    );
    const sjisBytes = new Uint8Array([0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd]);
    const endPart = new TextEncoder().encode('</body></html>');
    const body = new Uint8Array([...metaPart, ...sjisBytes, ...endPart]);

    const response = new Response(body, {
      headers: { 'Content-Type': 'text/html' },
    });

    const result = await decodeResponse(response);
    expect(result).toContain('こんにちは');
  });

  it('defaults to UTF-8 when no charset anywhere', async () => {
    const html = '<html><body>Hello world</body></html>';
    const response = new Response(html);

    const result = await decodeResponse(response);
    expect(result).toBe(html);
  });
});
