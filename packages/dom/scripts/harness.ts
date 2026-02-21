/**
 * Shared harness for DOM profiling scripts.
 *
 * Provides JSDOM setup, benchmark utilities, and DOM creation helpers.
 */

import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface BenchmarkResult {
  name: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
}

export function benchmark(
  name: string,
  fn: () => void,
  iterations: number,
  warmup = 10
): BenchmarkResult {
  for (let i = 0; i < warmup; i++) {
    fn();
  }

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { name, avgMs: avg, minMs: min, maxMs: max };
}

/**
 * Set JSDOM globals so @ingglish/dom modules work in Node.
 */
export function setupJSDOM(dom: JSDOM): void {
  // @ts-expect-error - global document for jsdom
  global.document = dom.window.document;
  // @ts-expect-error - global window for jsdom
  global.window = dom.window;
  // @ts-expect-error - global Document for jsdom
  global.Document = dom.window.Document;
  // @ts-expect-error - global Node for jsdom
  global.Node = dom.window.Node;
  // @ts-expect-error - global NodeFilter for jsdom
  global.NodeFilter = dom.window.NodeFilter;
  // @ts-expect-error - global requestAnimationFrame for jsdom
  global.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);
}

/**
 * Create a test DOM with generated paragraphs.
 */
export function createTestDOM(numParagraphs: number): JSDOM {
  const paragraphs = Array.from(
    { length: numParagraphs },
    (_, i) =>
      `<p>The quick brown fox jumps over the lazy dog. This is paragraph ${i + 1} with some text.</p>`
  ).join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <header>
    <nav>
      <a href="/" title="Go to homepage">Home</a>
      <a href="/about" title="Learn about us">About</a>
    </nav>
  </header>
  <main>
    <article>
      <h1>Main Article Title</h1>
      ${paragraphs}
      <div class="nested">
        <div class="deep">
          <span>Deeply nested text content here</span>
        </div>
      </div>
    </article>
    <aside>
      <h2>Sidebar</h2>
      <p>Some sidebar content with words to translate.</p>
    </aside>
  </main>
  <footer>
    <p>Copyright 2024</p>
  </footer>
  <!-- Skip elements -->
  <script>console.log("skip me")</script>
  <code>const x = 1;</code>
  <pre>preformatted text</pre>
</body>
</html>`;

  return new JSDOM(html);
}

/**
 * Create a realistic article-style DOM.
 */
export function createRealisticDOM(): JSDOM {
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

/**
 * Load the Wikipedia HTML fixture.
 */
export function loadWikipediaDOM(): JSDOM {
  const html = readFileSync(join(__dirname, 'wikipedia.html'), 'utf-8');
  const dom = new JSDOM(html);
  // @ts-expect-error - mock
  dom.window.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);
  return dom;
}
