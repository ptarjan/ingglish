import { bench, describe } from 'vitest';
import { collectTextNodes } from './text-nodes';

// Build a realistic page-like DOM for benchmarking
function buildLargePage(): Element {
  const container = document.createElement('div');

  // Simulate a page with ~200 elements and ~100 text nodes
  for (let section = 0; section < 5; section++) {
    const article = document.createElement('article');
    const h2 = document.createElement('h2');
    h2.textContent = `Section ${section + 1} heading`;
    article.append(h2);

    for (let p = 0; p < 5; p++) {
      const para = document.createElement('p');
      para.textContent = `This is paragraph ${p + 1} with some text to translate in section ${section + 1}.`;
      article.append(para);

      // Add some inline elements
      const span = document.createElement('span');
      span.textContent = ' More inline text.';
      para.append(span);
    }

    // Add elements that should be skipped
    const code = document.createElement('code');
    code.textContent = 'const x = 1;';
    article.append(code);

    const script = document.createElement('script');
    script.textContent = 'console.log("skip");';
    article.append(script);

    // Add whitespace-only text nodes
    article.append(document.createTextNode('   \n   '));
    article.append(document.createTextNode('\t'));

    container.append(article);
  }

  return container;
}

const page = buildLargePage();

describe('collectTextNodes', () => {
  bench('medium page (~200 elements)', () => {
    collectTextNodes(page);
  });
});
