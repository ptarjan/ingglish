import * as fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '../entry-ssg';

// Resolve relative to this file so it works regardless of cwd
const DOCS_DIR = path.resolve(import.meta.dirname, '../../../../docs');

// Convert heading text to slug (same logic as Docs.tsx)
function createHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-{2,}/g, '-')
    .replaceAll(/^-|-$/g, '');
}

// Extract all headings from markdown content
function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  // Handle both Unix and Windows line endings
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const match = /^#{1,6}\s+(.+)/.exec(line);
    if (match) {
      headings.push(createHeadingId(match[1]!.trim()));
    }
  }

  return headings;
}

// Extract all markdown links from content
function extractLinks(content: string): { href: string; line: number; text: string }[] {
  const links: { href: string; line: number; text: string }[] = [];
  const lines = content.split('\n');

  for (const [i, line] of lines.entries()) {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      links.push({ href: match[2]!, line: i + 1, text: match[1]! });
    }
  }

  return links;
}

// Get all markdown files in docs/
function getDocFiles(): string[] {
  const files = fs.readdirSync(DOCS_DIR);
  return files.filter((f) => f.endsWith('.md'));
}

describe('Docs sidebar completeness', () => {
  it('every doc file in docs/ is imported in Docs.tsx', () => {
    const docsComponent = fs.readFileSync(path.resolve(import.meta.dirname, 'Docs.tsx'), 'utf8');

    const docFiles = getDocFiles().filter((f) => f !== 'README.md');
    const missing = docFiles.filter((f) => !docsComponent.includes(`'../../../../docs/${f}'`));

    expect(missing, `Docs not in sidebar: ${missing.join(', ')}`).toEqual([]);
  });
});

describe('Docs links', () => {
  const docFiles = getDocFiles();

  for (const file of docFiles) {
    const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8');
    const links = extractLinks(content);

    // Filter to only internal links
    const internalLinks = links.filter(
      (link) => !link.href.startsWith('http://') && !link.href.startsWith('https://')
    );

    // Skip files with no internal links
    if (internalLinks.length === 0) {
      continue;
    }

    describe(file, () => {
      for (const link of internalLinks) {
        it(`line ${link.line}: "${link.text}" -> ${link.href}`, () => {
          const [mdPath, section] = link.href.split('#') as [string, string | undefined];

          // Check if target .md file exists
          if (mdPath.endsWith('.md')) {
            const targetFile = path.join(DOCS_DIR, mdPath);
            expect(fs.existsSync(targetFile), `File not found: ${mdPath}`).toBe(true);

            // Check if section anchor exists in target file
            if (section !== undefined && section !== '') {
              const targetContent = fs.readFileSync(targetFile, 'utf8');
              const headings = extractHeadings(targetContent);
              expect(
                headings.includes(section),
                `Section "#${section}" not found in ${mdPath}. Available: ${headings.join(', ')}`
              ).toBe(true);
            }
          } else if (mdPath === '' && section !== undefined && section !== '') {
            // Internal anchor link like #some-section
            const headings = extractHeadings(content);
            expect(
              headings.includes(section),
              `Section "#${section}" not found in ${file}. Available: ${headings.join(', ')}`
            ).toBe(true);
          }
        });
      }
    });
  }
});

describe('Docs SSG .md link transformation', () => {
  it('SSG output has no raw .md links — all transformed to /docs/ paths', async () => {
    const html = await render('/docs');
    const mdLinks = html.match(/href="[^"]*\.md[^"]*"/g);
    expect(mdLinks, `Found raw .md links in SSG output: ${mdLinks?.join(', ')}`).toBeNull();
  });

  it('SSG output contains /docs/ links with correct paths', async () => {
    const html = await render('/docs');
    // design-decisions.md is referenced from multiple docs
    expect(html).toContain('href="/docs/design-decisions/"');
  });

  it('SSG output preserves fragment identifiers in transformed links', async () => {
    const html = await render('/docs/design-decisions');
    // Check for a link with fragment (e.g. phoneme-mapping.md#some-section)
    const fragLink = /href="\/docs\/[^"][^"#]*#[^"]+"/.exec(html);
    expect(fragLink, 'Expected at least one /docs/ link with fragment').not.toBeNull();
  });
});
