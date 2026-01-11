/**
 * Vite plugin to transform markdown imports to HTML at build time.
 * Usage: import html from './doc.md?html'
 */
import { marked } from 'marked';
import type { Plugin } from 'vite';

export default function markdownPlugin(): Plugin {
  return {
    name: 'vite-plugin-md-html',
    transform(code, id) {
      // Handle .md imports (transform to HTML at build time)
      if (id.endsWith('.md') && !id.includes('node_modules')) {
        const html = marked.parse(code, { async: false });
        return {
          code: `export default ${JSON.stringify(html)};`,
          map: null,
        };
      }
    },
  };
}
