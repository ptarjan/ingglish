/**
 * Hand-written Ingglish outside the tutorial example tables must match the
 * translator: the static home page shell, the actual home page SSG renders
 * (the SSG build always replaces index.html's #root content, so that's what
 * ships to production — the shell only ever ships from a dev server or a
 * build-time render failure), and the "ough" cards. The shell's <head>
 * metadata must match HOME_META, which the app renders at runtime.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLangDict, translateSync } from 'ingglish';
import { beforeAll, describe, expect, it } from 'vitest';
import { oughExamples } from './data/tutorial-data';
import { render } from './entry-ssg';
import { HOME_META } from './route-meta';

const INDEX_HTML = path.join(path.dirname(fileURLToPath(import.meta.url)), '../index.html');

beforeAll(() => loadLangDict('en'), 60_000);

/** Every `"english" → "ingglish"` pair in the page. */
function extractArrowPairs(html: string): [string, string][] {
  return [...html.matchAll(/"([^"]+)"\s*(?:→|&rarr;)\s*"([^"]+)"/g)].map((m) => [m[1]!, m[2]!]);
}

const indexHtml = readFileSync(INDEX_HTML, 'utf8');

describe('index.html head', () => {
  it('description is HOME_META.description', () => {
    expect(indexHtml).toContain(`<meta name="description" content="${HOME_META.description}" />`);
  });
});

describe('index.html examples', () => {
  const pairs = extractArrowPairs(indexHtml);

  it('finds examples', () => {
    expect(pairs.length).toBeGreaterThan(0);
  });

  it.each(pairs)('"%s" → "%s"', (english, ingglish) => {
    expect(translateSync(english).toLowerCase()).toBe(ingglish);
  });
});

describe('home page SSG render', () => {
  it('ough example words match the translator', async () => {
    const html = await render('/');
    const start = html.indexOf('different ways, in ');
    const end = html.indexOf(' — six sounds', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const words = [...html.slice(start, end).matchAll(/<em>([^<]+)<\/em>/g)].map((m) => m[1]!);
    // Six English words, then their six Ingglish translations, in the same order.
    expect(words).toHaveLength(12);
    const english = words.slice(0, 6);
    const ingglish = words.slice(6);
    english.forEach((word, i) => {
      expect(translateSync(word).toLowerCase()).toBe(ingglish[i]);
    });
  });
});

// The cards swap only the "ough" letters, keeping the English prefix, so the
// translation must end in the card's sound + suffix.
describe('ough cards', () => {
  it.each(oughExamples)('$prefix·ough·$suffix → …$sound$suffix', ({ prefix, sound, suffix }) => {
    expect(
      translateSync(`${prefix}ough${suffix}`)
        .toLowerCase()
        .endsWith(sound + suffix)
    ).toBe(true);
  });
});
