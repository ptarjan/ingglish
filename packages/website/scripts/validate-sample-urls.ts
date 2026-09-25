#!/usr/bin/env npx tsx --conditions=source
/**
 * Validates all sample source URLs for the /url page.
 *
 * Fetches every URL through the same CORS proxy the live site uses (not
 * directly), because a target can be reachable directly while still being
 * blocked for the proxy specifically — e.g. a site that blocks Cloudflare
 * Workers' IP ranges, or a Cloudflare/DataDome challenge that only triggers
 * for datacenter traffic. Checking the target directly would silently miss
 * exactly the failures users hit on the live site.
 *
 * Checks:
 * - HTTP status of the proxied response (404, 5xx, timeouts, and any
 *   proxy-generated error like 415 "not HTML" or 403 "forbidden")
 * - Bot-protection / challenge pages that slip through as HTTP 200
 * - Redirects to a different host or to a login/signin page (e.g. a site
 *   that now gates logged-out access) — the proxy call itself succeeds, but
 *   the content isn't what the example promised
 * - Character encoding (non-UTF-8 that might cause mojibake)
 * - Whether our decodeHtmlBuffer() can detect the charset
 *
 * Usage:
 *   npx tsx --conditions=source packages/website/scripts/validate-sample-urls.ts
 *   npx tsx --conditions=source packages/website/scripts/validate-sample-urls.ts --fix  # remove broken URLs
 *
 * Env:
 *   VITE_CORS_PROXY_URL - override the proxy to test against (defaults to
 *     the deployed production worker, same as .github/workflows/pages.yml)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { detectBotProtection } from '../src/url-proxy';

const SAMPLES_DIR = join(import.meta.dirname, '..', 'src', 'data', 'samples');
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 10;

// Same proxy the production build points at (see .github/workflows/pages.yml).
// The worker only accepts requests carrying an Origin header from
// ALLOWED_ORIGINS (packages/cors-proxy/wrangler.toml) — a plain server-side
// fetch doesn't set one on its own the way a browser would, so we set it
// explicitly below.
const CORS_PROXY_URL =
  process.env.VITE_CORS_PROXY_URL ??
  'https://ingglish-cors-proxy.curly-unit-b9e0.workers.dev/?url=';
const PROXY_ORIGIN = 'https://ingglish.com';

// Also check the hardcoded EXAMPLE_URLS from UrlTranslator
const EXAMPLE_URLS = [
  {
    file: 'UrlTranslator.tsx',
    name: 'Wikipedia',
    url: 'https://en.wikipedia.org/wiki/English_language',
  },
  {
    file: 'UrlTranslator.tsx',
    name: 'US Constitution',
    url: 'https://www.archives.gov/founding-docs/constitution-transcript',
  },
  {
    file: 'UrlTranslator.tsx',
    name: 'Alice in Wonderland',
    url: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html',
  },
  {
    file: 'UrlTranslator.tsx',
    name: 'Dictionary',
    url: 'https://www.dictionary.com/browse/hello',
  },
  { file: 'UrlTranslator.tsx', name: 'Lobsters', url: 'https://lobste.rs' },
  { file: 'UrlTranslator.tsx', name: 'NPR', url: 'https://text.npr.org' },
  { file: 'UrlTranslator.tsx', name: 'The Guardian', url: 'https://www.theguardian.com/us' },
  { file: 'UrlTranslator.tsx', name: 'Tildes', url: 'https://tildes.net' },
  { file: 'UrlTranslator.tsx', name: 'GitHub', url: 'https://github.com/ptarjan/ingglish' },
];

interface UrlEntry {
  file: string;
  label: string;
  url: string;
}

interface CheckResult {
  charset: string | null;
  charsetSource: 'header' | 'html' | 'none' | null;
  entry: UrlEntry;
  error: string | null;
  status: number | null;
}

/** Extract charset from Content-Type header. */
export function charsetFromHeader(contentType: string | null): string | null {
  if (!contentType) return null;
  const match = /charset\s*=\s*([^\s;]+)/i.exec(contentType);
  return match?.[1]?.replace(/['"]/g, '') ?? null;
}

/** Extract charset from HTML content (same logic as decodeHtmlBuffer). */
export function charsetFromHtml(html: string): string | null {
  // XML declaration
  const xml = /encoding\s*=\s*["']([^"']+)["']/i.exec(html);
  if (xml?.[1]) return xml[1];
  // <meta charset="...">
  const meta = /<meta\s[^>]*charset\s*=\s*["']?([^\s"';>]+)/i.exec(html);
  if (meta?.[1]) return meta[1];
  // <meta http-equiv="Content-Type" content="...;charset=...">
  const httpEquiv = /content\s*=\s*["'][^"']*charset\s*=\s*([^\s"';>]+)/i.exec(html);
  if (httpEquiv?.[1]) return httpEquiv[1];
  return null;
}

/**
 * Checks whether a proxied response landed somewhere other than the
 * requested page — a different host, or a login/signin page. The proxy call
 * itself can succeed (HTTP 200) while the target quietly gates logged-out
 * access, e.g. old.reddit.com redirecting anonymous requests to
 * /login/?dest=....
 */
function redirectLooksLikeGate(requestedUrl: string, proxiedUrl: string | null): string | null {
  if (proxiedUrl === null) {
    return null;
  }
  let requestedHost: string;
  let finalUrl: URL;
  try {
    requestedHost = new URL(requestedUrl).hostname;
    finalUrl = new URL(proxiedUrl);
  } catch {
    return null;
  }
  if (finalUrl.hostname !== requestedHost) {
    return `Redirected to a different host: ${proxiedUrl}`;
  }
  if (/\/(log[-_]?in|sign[-_]?in)\b/i.test(finalUrl.pathname)) {
    return `Redirected to a login page: ${proxiedUrl}`;
  }
  return null;
}

async function checkUrl(entry: UrlEntry, timeoutMs: number = TIMEOUT_MS): Promise<CheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const proxyUrl = `${CORS_PROXY_URL}${encodeURIComponent(entry.url)}`;
    const response = await fetch(proxyUrl, {
      headers: {
        Accept: 'text/html',
        Origin: PROXY_ORIGIN,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ingglish-url-validator/1.0',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    const status = response.status;
    const contentType = response.headers.get('content-type');
    const headerCharset = charsetFromHeader(contentType);
    const proxiedUrl = response.headers.get('x-proxied-url');

    // Read first 4KB to check HTML charset declaration and bot-protection pages
    const buffer = await response.arrayBuffer();
    const peek = new TextDecoder('latin1').decode(buffer.slice(0, 4096));
    const htmlCharset = charsetFromHtml(peek);

    const charset = headerCharset ?? htmlCharset;
    const charsetSource = headerCharset ? 'header' : htmlCharset ? 'html' : 'none';

    let error: string | null = null;
    if (status >= 400) {
      // Read the proxy's own error body (e.g. "Only HTML content is
      // supported... Body preview: Sorry") when the fetch itself is 400+ so
      // the reason shows up in the report instead of just the status code.
      const bodyText = new TextDecoder('utf-8').decode(buffer.slice(0, 300)).trim();
      error = bodyText ? `HTTP ${status} via proxy — ${bodyText}` : `HTTP ${status} via proxy`;
    } else {
      error = detectBotProtection(peek) ?? redirectLooksLikeGate(entry.url, proxiedUrl);
    }

    return { charset, charsetSource, entry, error, status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const error = message.includes('abort') ? 'Timeout' : message;
    return { charset: null, charsetSource: null, entry, error, status: null };
  } finally {
    clearTimeout(timeout);
  }
}

/** Run checks with limited concurrency. */
async function checkAll(entries: UrlEntry[]): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const queue = [...entries];

  async function worker() {
    while (queue.length > 0) {
      const entry = queue.shift()!;
      const result = await checkUrl(entry);
      results.push(result);

      // Progress indicator
      const icon = result.error ? '✗' : '✓';
      const charsetInfo =
        result.charset && !/utf-?8/i.test(result.charset) ? ` [${result.charset}]` : '';
      process.stderr.write(
        `${icon} ${result.entry.file}:${result.entry.label}${charsetInfo}${result.error ? ` — ${result.error}` : ''}\n`
      );
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // A batch of CONCURRENCY simultaneous requests can starve a slow-but-
  // working site into a false timeout purely from contention on the proxy
  // worker or the site's own rate limiting — retest timeouts one at a time,
  // with a longer budget, before reporting them as broken.
  const timedOut = results.filter((r) => r.error === 'Timeout');
  if (timedOut.length > 0) {
    process.stderr.write(`\nRetrying ${timedOut.length} timeout(s) one at a time...\n`);
    for (const prior of timedOut) {
      const retry = await checkUrl(prior.entry, TIMEOUT_MS * 2);
      const index = results.indexOf(prior);
      results[index] = retry;
      const icon = retry.error ? '✗' : '✓';
      process.stderr.write(
        `${icon} (retry) ${retry.entry.file}:${retry.entry.label}${retry.error ? ` — ${retry.error}` : ''}\n`
      );
    }
  }

  return results;
}

/** Collect all source URLs from sample files. */
async function collectUrls(): Promise<UrlEntry[]> {
  const { ALL_SAMPLES } = await import('../src/data/language-samples');
  const entries: UrlEntry[] = [];

  for (const [lang, samples] of Object.entries(ALL_SAMPLES)) {
    for (const sample of samples as Array<{ label: string; source?: string; text: string }>) {
      if (sample.source) {
        entries.push({ file: `${lang}.ts`, label: sample.label, url: sample.source });
      }
    }
  }

  // Add hardcoded example URLs
  for (const ex of EXAMPLE_URLS) {
    entries.push({ file: ex.file, label: ex.name, url: ex.url });
  }

  return entries;
}

/** Remove source field from broken samples in the .ts files. */
function fixBroken(broken: CheckResult[]): void {
  // Group by file
  const byFile = new Map<string, string[]>();
  for (const r of broken) {
    const file = r.entry.file;
    if (file === 'UrlTranslator.tsx') continue; // Don't auto-fix hardcoded URLs
    const urls = byFile.get(file) ?? [];
    urls.push(r.entry.url);
    byFile.set(file, urls);
  }

  for (const [file, urls] of byFile) {
    const filePath = join(SAMPLES_DIR, file);
    let content = readFileSync(filePath, 'utf-8');
    for (const url of urls) {
      // Remove source: '...' or source: "..." line (possibly multi-line with URL)
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Single-line: source: 'url',
      content = content.replace(new RegExp(`\\s*source:\\s*['"]${escaped}['"],?`, 'g'), '');
      // Multi-line: source:\n      'url',
      content = content.replace(new RegExp(`\\s*source:\\s*\\n\\s*['"]${escaped}['"],?`, 'g'), '');
    }
    writeFileSync(filePath, content);
    console.log(`Fixed ${file}: removed ${urls.length} broken source URL(s)`);
  }
}

async function main() {
  const fix = process.argv.includes('--fix');
  const entries = await collectUrls();
  console.log(`Checking ${entries.length} URLs (concurrency: ${CONCURRENCY})...\n`);

  const results = await checkAll(entries);

  // Categorize
  const broken = results.filter((r) => r.error !== null);
  const nonUtf8 = results.filter((r) => r.charset !== null && !/utf-?8/i.test(r.charset));
  const noCharset = results.filter((r) => r.charsetSource === 'none' && r.error === null);

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTS: ${results.length} URLs checked`);
  console.log('='.repeat(60));

  if (broken.length > 0) {
    console.log(`\n❌ BROKEN (${broken.length}):`);
    for (const r of broken) {
      console.log(`  ${r.entry.file}: ${r.entry.label}`);
      console.log(`    ${r.entry.url}`);
      console.log(`    Error: ${r.error}`);
    }
  }

  if (nonUtf8.length > 0) {
    console.log(`\n⚠️  NON-UTF-8 ENCODING (${nonUtf8.length}):`);
    for (const r of nonUtf8) {
      console.log(`  ${r.entry.file}: ${r.entry.label}`);
      console.log(`    ${r.entry.url}`);
      console.log(`    Charset: ${r.charset} (from ${r.charsetSource})`);
    }
  }

  if (noCharset.length > 0) {
    console.log(`\n⚠️  NO CHARSET DECLARED (${noCharset.length}) — relies on UTF-8 fallback:`);
    for (const r of noCharset) {
      console.log(`  ${r.entry.file}: ${r.entry.label}`);
      console.log(`    ${r.entry.url}`);
    }
  }

  const ok = results.filter(
    (r) => r.error === null && (r.charset === null || /utf-?8/i.test(r.charset ?? ''))
  );
  console.log(`\n✅ OK: ${ok.length}`);
  console.log(`❌ Broken: ${broken.length}`);
  console.log(`⚠️  Non-UTF-8: ${nonUtf8.length}`);
  console.log(`⚠️  No charset: ${noCharset.length}`);

  if (fix && broken.length > 0) {
    console.log('\n--- Fixing broken URLs ---');
    fixBroken(broken);
  } else if (broken.length > 0) {
    console.log('\nRun with --fix to remove broken source URLs from sample files.');
  }

  // Exit with error if there are broken URLs
  if (broken.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
