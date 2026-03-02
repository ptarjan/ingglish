/**
 * Generate per-route Open Graph images at build time.
 *
 * Reads the existing og-image.svg template, swaps the subtitle and examples
 * text for each route, renders to PNG via @resvg/resvg-js, and writes to
 * dist/og/<route>.png (1200×630).
 *
 * Called as a Vite writeBundle plugin from vite.config.ts.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Resvg } from '@resvg/resvg-js';

interface RouteOg {
  subtitle: string;
  examples: string;
}

export const ROUTE_OG: Record<string, RouteOg> = {
  default: {
    subtitle: 'What if English spelling made sense?',
    examples: 'though \u2192 dhoh \u00b7 through \u2192 throo \u00b7 enough \u2192 inuhf',
  },
  text: {
    subtitle: 'Translate Any Text to Phonetic English',
    examples:
      '\u201cbeautiful\u201d \u2192 \u201cbyootafal\u201d \u00b7 \u201cthought\u201d \u2192 \u201cthawt\u201d',
  },
  url: {
    subtitle: 'Translate Entire Webpages',
    examples: 'Paste any URL \u00b7 Read in phonetic English',
  },
  guide: {
    subtitle: 'Complete Phonetic Spelling Guide',
    examples: 'ee \u00b7 ay \u00b7 ai \u00b7 oh \u00b7 oo \u00b7 dh \u00b7 sh \u00b7 zh',
  },
  explore: {
    subtitle: 'Look Up Any Word',
    examples: 'Phonemes \u00b7 IPA \u00b7 Homophones \u00b7 Frequency',
  },
  experiment: {
    subtitle: 'Design Your Own Spelling System',
    examples: 'Customize how each sound is written',
  },
  extension: {
    subtitle: 'One-Click Browser Extension',
    examples: 'Translate any webpage instantly',
  },
  challenge: {
    subtitle: 'Test Your Reading Speed',
    examples: 'How fast can you read phonetic English?',
  },
  docs: {
    subtitle: 'Technical Documentation',
    examples: 'Architecture \u00b7 API \u00b7 Design Decisions',
  },
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Generate all per-route OG images and the default og-image.png */
export function generateOgImages(distDir: string, svgPath: string): void {
  const templateSvg = readFileSync(svgPath, 'utf-8');
  const ogDir = join(distDir, 'og');
  mkdirSync(ogDir, { recursive: true });

  for (const [route, { subtitle, examples }] of Object.entries(ROUTE_OG)) {
    const svg = templateSvg
      .replace(/(<text x="600" y="410"[^>]*>)[^<]*(<\/text>)/, `$1${escapeXml(subtitle)}$2`)
      .replace(/(<text x="600" y="520"[^>]*>)[^<]*(<\/text>)/, `$1${escapeXml(examples)}$2`);

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const png = resvg.render().asPng();

    if (route === 'default') {
      // Overwrite the root og-image.png with the rendered version
      writeFileSync(join(distDir, 'og-image.png'), png);
    }
    writeFileSync(join(ogDir, `${route === 'default' ? 'index' : route}.png`), png);
  }
}
