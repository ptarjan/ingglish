/**
 * Profile DOM translation with realistic HTML content.
 */

import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';

const ITERATIONS = 20;

// Realistic article-style HTML content (simulating a news article or blog post)
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

        <h3>React: Building User Interfaces</h3>
        <p>Developed by Facebook, React has become one of the most popular libraries for building user interfaces. Its component-based architecture and virtual DOM make it efficient and flexible for building everything from simple websites to complex enterprise applications.</p>
        <p>React's declarative approach to building UIs means you describe what you want to render, and React figures out how to update the DOM efficiently. This mental model makes it easier to reason about your application's behavior.</p>

        <h3>Vue: The Progressive Framework</h3>
        <p>Vue takes a different approach, offering a more opinionated framework that's easier to learn but still powerful enough for complex applications. Its gentle learning curve and excellent documentation have made it popular among developers transitioning from traditional web development.</p>

        <h3>Angular: Enterprise-Ready Development</h3>
        <p>Backed by Google, Angular provides a comprehensive framework for building large-scale enterprise applications. Its strong typing with TypeScript and built-in solutions for common problems make it well-suited for teams working on complex projects.</p>
      </section>

      <section>
        <h2>Backend Development Essentials</h2>
        <p>While the frontend handles what users see and interact with, the backend powers the logic and data management behind the scenes. Modern backend development involves choosing the right technologies and architectures for your specific needs.</p>

        <h3>Node.js: JavaScript on the Server</h3>
        <p>Node.js brought JavaScript to the server, enabling full-stack development with a single language. Its event-driven, non-blocking architecture makes it excellent for building real-time applications and APIs that need to handle many concurrent connections.</p>

        <h3>Python: Versatile and Powerful</h3>
        <p>Python's readability and extensive ecosystem make it a popular choice for backend development. Frameworks like Django and Flask provide different levels of abstraction, from batteries-included solutions to minimal microframeworks.</p>

        <h3>Databases: Storing and Retrieving Data</h3>
        <p>Understanding databases is crucial for any backend developer. SQL databases like PostgreSQL and MySQL have been workhorses of the industry for decades, while NoSQL solutions like MongoDB offer flexibility for certain use cases. Choosing the right database depends on your data structure, query patterns, and scalability requirements.</p>
      </section>

      <section>
        <h2>DevOps and Deployment</h2>
        <p>Getting your application into production requires understanding of deployment processes, continuous integration, and infrastructure management. Modern DevOps practices automate these processes to enable faster and more reliable releases.</p>

        <h3>Containerization with Docker</h3>
        <p>Docker has revolutionized how we package and deploy applications. By containerizing your application, you ensure it runs the same way in development, testing, and production environments. This consistency eliminates many deployment-related issues.</p>

        <h3>Cloud Platforms</h3>
        <p>Cloud providers like AWS, Google Cloud, and Azure offer the infrastructure and services needed to run modern web applications at scale. From virtual machines to serverless functions, these platforms provide building blocks for any architecture.</p>

        <h3>Continuous Integration and Deployment</h3>
        <p>CI/CD pipelines automate the process of testing and deploying code changes. Tools like GitHub Actions, Jenkins, and CircleCI run your tests automatically and can deploy your application whenever changes are merged to the main branch.</p>
      </section>

      <section>
        <h2>Performance Optimization</h2>
        <p>Building fast websites is crucial for user experience and business success. Users expect pages to load quickly, and search engines factor performance into their rankings. Understanding how to optimize your applications is a key skill for modern web developers.</p>

        <h3>Measuring Performance</h3>
        <p>Before optimizing, you need to measure. Tools like Lighthouse, WebPageTest, and browser developer tools provide insights into your application's performance. Key metrics include First Contentful Paint, Time to Interactive, and Core Web Vitals.</p>

        <h3>Optimization Strategies</h3>
        <p>Common optimization strategies include minifying and compressing assets, implementing caching strategies, lazy loading images and code, and optimizing your critical rendering path. Each of these techniques can significantly improve your application's performance.</p>

        <h3>The Importance of Profiling</h3>
        <p>Rather than guessing at performance problems, profiling helps you identify actual bottlenecks. Browser profiling tools can show you exactly where time is being spent, enabling targeted optimizations that have the greatest impact.</p>
      </section>

      <section>
        <h2>Conclusion</h2>
        <p>Modern web development encompasses a vast array of technologies, patterns, and practices. From the fundamentals of HTML, CSS, and JavaScript to advanced topics like containerization and continuous deployment, there's always more to learn.</p>
        <p>The key to success in this field is maintaining a growth mindset and staying curious about new developments while building a strong foundation in the fundamentals. The technologies may change, but the underlying principles of good software engineering remain constant.</p>
        <p>Whether you're just starting your web development journey or looking to expand your skills, focusing on understanding concepts deeply rather than just learning syntax will serve you well throughout your career.</p>
      </section>
    </article>

    <aside class="sidebar">
      <section>
        <h3>Related Articles</h3>
        <ul>
          <li><a href="/articles/react-hooks-guide">A Complete Guide to React Hooks</a></li>
          <li><a href="/articles/css-grid-layouts">Mastering CSS Grid Layouts</a></li>
          <li><a href="/articles/typescript-best-practices">TypeScript Best Practices for Large Applications</a></li>
          <li><a href="/articles/api-design">Designing RESTful APIs That Developers Love</a></li>
          <li><a href="/articles/testing-strategies">Testing Strategies for Modern Web Applications</a></li>
        </ul>
      </section>

      <section>
        <h3>Popular Tags</h3>
        <div class="tags">
          <a href="/tags/javascript">JavaScript</a>
          <a href="/tags/react">React</a>
          <a href="/tags/css">CSS</a>
          <a href="/tags/nodejs">Node.js</a>
          <a href="/tags/typescript">TypeScript</a>
          <a href="/tags/performance">Performance</a>
        </div>
      </section>

      <section>
        <h3>Newsletter</h3>
        <p>Subscribe to our newsletter for the latest web development insights delivered to your inbox.</p>
        <form>
          <input type="email" placeholder="Enter your email address" aria-label="Email address">
          <button type="submit">Subscribe</button>
        </form>
      </section>
    </aside>
  </main>

  <footer>
    <div class="footer-content">
      <div class="footer-section">
        <h4>About Us</h4>
        <p>We are a team of passionate developers sharing our knowledge and experience with the web development community. Our mission is to help developers build better applications.</p>
      </div>
      <div class="footer-section">
        <h4>Quick Links</h4>
        <nav>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/sitemap">Sitemap</a>
        </nav>
      </div>
      <div class="footer-section">
        <h4>Connect With Us</h4>
        <p>Follow us on social media for updates and community discussions.</p>
      </div>
    </div>
    <p class="copyright">Copyright 2024 Web Dev Insights. All rights reserved.</p>
  </footer>
</body>
</html>`;

  return new JSDOM(html);
}

async function main() {
  console.log('=== Real HTML DOM Profile ===\n');

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

  const { collectTextNodes } = await import('../src/utils/text-nodes');
  const { shouldSkipElement, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES } =
    await import('../src/utils/skip-rules');
  const { translate } = await import('@ingglish/core');
  const { applyTranslationsMap } = await import('../src/translate/apply-map');
  const { extractWordsFromNodes } = await import('../src/utils/extract');

  // Load dictionary
  console.log('Loading dictionary...');
  await translate('hello');

  // Analyze the DOM
  const textNodes = collectTextNodes(dom.window.document.body);
  const elements = Array.from(dom.window.document.querySelectorAll('*'));
  const words = extractWordsFromNodes(textNodes);

  console.log('');
  console.log('--- DOM Statistics ---');
  console.log(`Total elements: ${elements.length}`);
  console.log(`Text nodes: ${textNodes.length}`);
  console.log(`Unique words: ${words.length}`);

  // Count total words
  let totalWords = 0;
  for (const node of textNodes) {
    const text = node.textContent ?? '';
    totalWords += text.split(/\s+/).filter((w) => w.length > 0).length;
  }
  console.log(`Total word occurrences: ${totalWords}`);
  console.log('');

  // Profile collectTextNodes
  console.log('--- Profile: collectTextNodes ---\n');

  // Warmup
  for (let i = 0; i < 10; i++) {
    const freshDOM = createRealisticDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;
    collectTextNodes(freshDOM.window.document.body);
  }

  const collectTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const freshDOM = createRealisticDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;

    const start = performance.now();
    collectTextNodes(freshDOM.window.document.body);
    collectTimes.push(performance.now() - start);
  }

  const collectAvg = collectTimes.reduce((a, b) => a + b, 0) / collectTimes.length;
  console.log(
    `collectTextNodes:  avg: ${collectAvg.toFixed(3)}ms  (${((collectAvg / textNodes.length) * 1000).toFixed(2)}µs per node)`
  );

  // Profile shouldSkipElement
  console.log('\n--- Profile: shouldSkipElement ---\n');

  // @ts-expect-error - global
  global.document = dom.window.document;
  const skipTimes: number[] = [];
  for (let i = 0; i < ITERATIONS * 10; i++) {
    const start = performance.now();
    for (const el of elements) {
      shouldSkipElement(el, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
    skipTimes.push(performance.now() - start);
  }

  const skipAvg = skipTimes.reduce((a, b) => a + b, 0) / skipTimes.length;
  console.log(
    `shouldSkipElement x${elements.length}:  avg: ${skipAvg.toFixed(3)}ms  (${((skipAvg / elements.length) * 1000).toFixed(2)}µs per element)`
  );

  // Profile extractWordsFromNodes
  console.log('\n--- Profile: extractWordsFromNodes ---\n');

  const extractTimes: number[] = [];
  for (let i = 0; i < ITERATIONS * 10; i++) {
    const start = performance.now();
    extractWordsFromNodes(textNodes);
    extractTimes.push(performance.now() - start);
  }

  const extractAvg = extractTimes.reduce((a, b) => a + b, 0) / extractTimes.length;
  console.log(
    `extractWordsFromNodes:  avg: ${extractAvg.toFixed(3)}ms  (${words.length} unique words)`
  );

  // Build realistic translations map
  const translations: Record<string, string> = {};
  for (const word of words) {
    // Simulate actual translations
    translations[word] = word + '-tr';
  }

  // Profile applyTranslationsMap
  console.log('\n--- Profile: applyTranslationsMap ---\n');

  const applyTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const freshDOM = createRealisticDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Document = freshDOM.window.Document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;

    const start = performance.now();
    await applyTranslationsMap(freshDOM.window.document.body, translations, {
      showTooltips: false,
    });
    applyTimes.push(performance.now() - start);
  }

  const applyAvg = applyTimes.reduce((a, b) => a + b, 0) / applyTimes.length;
  const applyMin = Math.min(...applyTimes);
  const applyMax = Math.max(...applyTimes);
  console.log(
    `applyTranslationsMap:  avg: ${applyAvg.toFixed(3)}ms  min: ${applyMin.toFixed(3)}ms  max: ${applyMax.toFixed(3)}ms`
  );
  console.log(`Per text node: ${((applyAvg / textNodes.length) * 1000).toFixed(2)}µs`);
  console.log(`Per word: ${((applyAvg / totalWords) * 1000).toFixed(2)}µs`);

  // Breakdown: time without DOM creation overhead
  console.log('\n--- Profile: processTextNode only (no DOM creation) ---\n');

  // Pre-create DOM
  const preDOM = createRealisticDOM();
  // @ts-expect-error - global
  global.document = preDOM.window.document;
  // @ts-expect-error - global
  global.Document = preDOM.window.Document;
  // @ts-expect-error - global
  global.Node = preDOM.window.Node;
  // @ts-expect-error - global
  global.NodeFilter = preDOM.window.NodeFilter;

  const preTextNodes = collectTextNodes(preDOM.window.document.body);

  // Time just the text node processing (simulating what happens after DOM is collected)
  const { normalizeApostrophes, detectCasePattern, applyCasePattern } =
    await import('@ingglish/normalize');
  const WORD_REGEX = /[a-zA-Z']+/g;

  const processTimes: number[] = [];
  for (let i = 0; i < ITERATIONS * 10; i++) {
    let totalProcessTime = 0;
    for (const textNode of preTextNodes) {
      const text = textNode.textContent ?? '';
      if (text.length === 0) continue;

      const start = performance.now();
      const normalized = normalizeApostrophes(text);
      let result = '';
      let lastIndex = 0;
      let match;
      WORD_REGEX.lastIndex = 0;

      while ((match = WORD_REGEX.exec(normalized)) !== null) {
        result += normalized.slice(lastIndex, match.index);
        lastIndex = match.index + match[0].length;
        const word = match[0];
        const translated = translations[word.toLowerCase()];
        if (translated) {
          const pattern = detectCasePattern(word);
          result += applyCasePattern(translated, pattern, word);
        } else {
          result += word;
        }
      }
      result += normalized.slice(lastIndex);
      totalProcessTime += performance.now() - start;
    }
    processTimes.push(totalProcessTime);
  }

  const processAvg = processTimes.reduce((a, b) => a + b, 0) / processTimes.length;
  console.log(
    `Pure text processing:  avg: ${processAvg.toFixed(3)}ms  (${((processAvg / preTextNodes.length) * 1000).toFixed(2)}µs per node)`
  );
  console.log(`DOM update overhead: ~${(applyAvg - processAvg - collectAvg).toFixed(3)}ms`);

  // Summary
  console.log('\n=== Summary ===\n');
  console.log(
    `Total translation time: ${applyAvg.toFixed(3)}ms for ${textNodes.length} text nodes`
  );
  console.log(`Breakdown:`);
  console.log(
    `  - collectTextNodes: ${collectAvg.toFixed(3)}ms (${((collectAvg / applyAvg) * 100).toFixed(1)}%)`
  );
  console.log(
    `  - Text processing:  ${processAvg.toFixed(3)}ms (${((processAvg / applyAvg) * 100).toFixed(1)}%)`
  );
  console.log(
    `  - DOM updates:      ${(applyAvg - processAvg - collectAvg).toFixed(3)}ms (${(((applyAvg - processAvg - collectAvg) / applyAvg) * 100).toFixed(1)}%)`
  );
}

main().catch(console.error);
