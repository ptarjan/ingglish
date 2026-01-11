/**
 * Profile TreeWalker alternatives for collectTextNodes.
 */

import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';

const ITERATIONS = 100;

// Realistic article-style HTML content
function createRealisticDOM(): JSDOM {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Understanding Modern Web Development: A Comprehensive Guide</title>
  <style>
    body { font-family: system-ui, sans-serif; }
    .highlight { background: yellow; }
  </style>
  <script>
    console.log("This should be skipped");
    const x = { message: "not translated" };
  </script>
</head>
<body>
  <header class="site-header">
    <nav aria-label="Main navigation">
      <a href="/" title="Return to homepage">Home</a>
      <a href="/about" title="Learn more about us">About</a>
      <a href="/articles" title="Browse our articles">Articles</a>
      <a href="/contact" title="Get in touch with our team">Contact</a>
    </nav>
  </header>

  <main>
    <article>
      <header>
        <h1>Understanding Modern Web Development: A Comprehensive Guide</h1>
        <p class="meta">Published on January 15, 2024 by John Smith</p>
        <p class="summary">In this comprehensive guide, we explore the fundamental concepts and best practices that define modern web development in today's rapidly evolving technological landscape.</p>
      </header>

      <section>
        <h2>Introduction to Web Development</h2>
        <p>Web development has evolved dramatically over the past decade. What started as simple static pages has transformed into complex interactive applications that power everything from social networks to banking systems. Understanding these changes is crucial for anyone looking to build modern web applications.</p>
        <p>The modern web developer needs to understand not just how to write code, but also how to architect systems that are scalable, maintainable, and performant. This requires knowledge of both frontend and backend technologies, as well as the infrastructure that connects them.</p>
        <p>In this article, we'll explore the key concepts that every web developer should understand, from the basics of how browsers work to advanced topics like server-side rendering and progressive web applications.</p>
      </section>

      <section>
        <h2>The Building Blocks of the Web</h2>
        <p>At its core, the web is built on three fundamental technologies: HTML, CSS, and JavaScript. These technologies work together to create the rich interactive experiences we've come to expect from modern websites.</p>

        <h3>HTML: The Structure of the Web</h3>
        <p>HTML, or Hypertext Markup Language, provides the structural foundation for web pages. Every element you see on a webpage—from headings and paragraphs to images and links—is defined using HTML. Understanding semantic HTML is essential for creating accessible and search-engine-friendly websites.</p>
        <p>Modern HTML introduces elements like <code>&lt;article&gt;</code>, <code>&lt;section&gt;</code>, and <code>&lt;nav&gt;</code> that provide meaning to your content. These semantic elements help screen readers and search engines understand the structure of your page, improving both accessibility and SEO.</p>

        <h3>CSS: Styling the Web</h3>
        <p>Cascading Style Sheets control the visual presentation of your web pages. From colors and fonts to layouts and animations, CSS gives you complete control over how your content looks. Modern CSS features like Flexbox and Grid have revolutionized how we approach layout design.</p>
        <p>CSS preprocessors like Sass and Less extend the language with variables, mixins, and nested rules, making it easier to write maintainable stylesheets for large projects. More recently, CSS-in-JS solutions have gained popularity in the React ecosystem.</p>

        <h3>JavaScript: Bringing Pages to Life</h3>
        <p>JavaScript is the programming language of the web. It enables dynamic content, interactive features, and client-side logic. From simple form validation to complex single-page applications, JavaScript powers the interactive experiences that define modern web development.</p>
        <p>The JavaScript ecosystem has exploded in recent years, with frameworks like React, Vue, and Angular dominating frontend development. Understanding the fundamentals of JavaScript is essential before diving into these frameworks.</p>
      </section>

      <section>
        <h2>Frontend Frameworks and Libraries</h2>
        <p>Modern web development relies heavily on frameworks and libraries that abstract away complexity and provide standardized patterns for building applications. These tools have transformed how we build user interfaces and manage application state.</p>
        <p>Developed by Facebook, React has become one of the most popular libraries for building user interfaces. Its component-based architecture and virtual DOM make it efficient and flexible for building everything from simple websites to complex enterprise applications.</p>
        <p>React's declarative approach to building UIs means you describe what you want to render, and React figures out how to update the DOM efficiently. This mental model makes it easier to reason about your application's behavior.</p>
        <p>Vue takes a different approach, offering a more opinionated framework that's easier to learn but still powerful enough for complex applications. Its gentle learning curve and excellent documentation have made it popular among developers transitioning from traditional web development.</p>
        <p>Backed by Google, Angular provides a comprehensive framework for building large-scale enterprise applications. Its strong typing with TypeScript and built-in solutions for common problems make it well-suited for teams working on complex projects.</p>
      </section>
    </article>
  </main>

  <footer>
    <p class="copyright">Copyright 2024 Web Dev Insights. All rights reserved.</p>
  </footer>
</body>
</html>`;

  return new JSDOM(html);
}

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'KBD',
  'SAMP',
  'VAR',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SVG',
  'MATH',
  'CANVAS',
]);

async function main() {
  console.log('=== TreeWalker Alternatives Profile ===\n');

  const dom = createRealisticDOM();
  // @ts-expect-error - global
  global.document = dom.window.document;
  // @ts-expect-error - global
  global.Document = dom.window.Document;
  // @ts-expect-error - global
  global.window = dom.window;
  // @ts-expect-error - global
  global.Node = dom.window.Node;
  // @ts-expect-error - global
  global.NodeFilter = dom.window.NodeFilter;

  // Current implementation (from text-nodes.ts)
  function collectTextNodesCurrent(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node: Node): number {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return SKIP_TAGS.has((node as Element).tagName)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_SKIP;
        }
        const text = (node as Text).textContent?.trim() ?? '';
        return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });

    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) {
        textNodes.push(walker.currentNode as Text);
      }
    }
    return textNodes;
  }

  // Alternative 1: Only show text nodes, check parent in filter
  function collectTextNodesTextOnly(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node: Node): number {
        // Check parent chain for skip tags
        let parent = node.parentElement;
        while (parent) {
          if (SKIP_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        const text = (node as Text).textContent?.trim() ?? '';
        return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }
    return textNodes;
  }

  // Alternative 2: Recursive traversal (no TreeWalker)
  function collectTextNodesRecursive(root: Element | Document): Text[] {
    const textNodes: Text[] = [];

    function traverse(node: Node): void {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has((node as Element).tagName)) {
          return; // Skip entire subtree
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() ?? '';
        if (text.length > 0) {
          textNodes.push(node as Text);
        }
      }
    }

    if (root instanceof Document) {
      traverse(root.body);
    } else {
      traverse(root);
    }
    return textNodes;
  }

  // Alternative 3: Iterative stack-based (no TreeWalker, no recursion)
  function collectTextNodesStack(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const stack: Node[] = [root instanceof Document ? root.body : root];

    while (stack.length > 0) {
      const node = stack.pop()!;

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has((node as Element).tagName)) {
          continue;
        }
        // Push children in reverse order so we process left-to-right
        const children = node.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push(children[i]);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() ?? '';
        if (text.length > 0) {
          textNodes.push(node as Text);
        }
      }
    }
    return textNodes;
  }

  // Alternative 4: Simple TreeWalker without filter callback
  function collectTextNodesSimpleWalker(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null // No filter - check manually
    );

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.textContent?.trim() ?? '';
      if (text.length === 0) continue;

      // Check parent chain for skip tags
      let skip = false;
      let parent = node.parentElement;
      while (parent && !skip) {
        if (SKIP_TAGS.has(parent.tagName)) {
          skip = true;
        }
        parent = parent.parentElement;
      }
      if (!skip) {
        textNodes.push(node);
      }
    }
    return textNodes;
  }

  // Verify all produce same output
  const currentResult = collectTextNodesCurrent(dom.window.document.body);
  console.log(`Current implementation: ${currentResult.length} text nodes`);

  const textOnlyResult = collectTextNodesTextOnly(dom.window.document.body);
  console.log(
    `Text-only walker: ${textOnlyResult.length} text nodes (match: ${textOnlyResult.length === currentResult.length})`
  );

  const recursiveResult = collectTextNodesRecursive(dom.window.document.body);
  console.log(
    `Recursive: ${recursiveResult.length} text nodes (match: ${recursiveResult.length === currentResult.length})`
  );

  const stackResult = collectTextNodesStack(dom.window.document.body);
  console.log(
    `Stack-based: ${stackResult.length} text nodes (match: ${stackResult.length === currentResult.length})`
  );

  const simpleResult = collectTextNodesSimpleWalker(dom.window.document.body);
  console.log(
    `Simple walker: ${simpleResult.length} text nodes (match: ${simpleResult.length === currentResult.length})`
  );
  console.log('');

  // Benchmark each
  function bench(name: string, fn: () => Text[]): number {
    // Warmup
    for (let i = 0; i < 50; i++) {
      const freshDOM = createRealisticDOM();
      // @ts-expect-error - global
      global.document = freshDOM.window.document;
      // @ts-expect-error - global
      global.Node = freshDOM.window.Node;
      // @ts-expect-error - global
      global.NodeFilter = freshDOM.window.NodeFilter;
      fn();
    }

    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const freshDOM = createRealisticDOM();
      // @ts-expect-error - global
      global.document = freshDOM.window.document;
      // @ts-expect-error - global
      global.Node = freshDOM.window.Node;
      // @ts-expect-error - global
      global.NodeFilter = freshDOM.window.NodeFilter;

      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(
      `${name.padEnd(35)} avg: ${avg.toFixed(3)}ms  min: ${min.toFixed(3)}ms  max: ${max.toFixed(3)}ms`
    );
    return avg;
  }

  console.log('--- Benchmarks ---\n');

  const currentMs = bench('Current (SHOW_ELEMENT|SHOW_TEXT)', () =>
    collectTextNodesCurrent(document.body)
  );
  const textOnlyMs = bench('Text-only walker (parent check)', () =>
    collectTextNodesTextOnly(document.body)
  );
  const recursiveMs = bench('Recursive traversal', () => collectTextNodesRecursive(document.body));
  const stackMs = bench('Stack-based iterative', () => collectTextNodesStack(document.body));
  const simpleMs = bench('Simple walker (no filter)', () =>
    collectTextNodesSimpleWalker(document.body)
  );

  console.log('\n--- Comparison vs Current ---\n');
  console.log(
    `Text-only walker:    ${(((currentMs - textOnlyMs) / currentMs) * 100).toFixed(1)}% ${textOnlyMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Recursive:           ${(((currentMs - recursiveMs) / currentMs) * 100).toFixed(1)}% ${recursiveMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Stack-based:         ${(((currentMs - stackMs) / currentMs) * 100).toFixed(1)}% ${stackMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Simple walker:       ${(((currentMs - simpleMs) / currentMs) * 100).toFixed(1)}% ${simpleMs < currentMs ? 'faster' : 'slower'}`
  );
}

main().catch(console.error);
