import type { JSX } from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';

interface HeadingInfo {
  id: string;
  text: string;
  level: number;
}

// Import markdown files - vite-plugin-md converts to HTML at build time
import apiReference from '../../../../docs/generated/README.md';
import architecture from '../../../../docs/architecture.md';
import contributing from '../../../../docs/contributing.md';
import deploymentDoc from '../../../../docs/deployment.md';
import designDecisions from '../../../../docs/design-decisions.md';
import orthographyComparison from '../../../../docs/orthography-comparison.md';
import performanceDoc from '../../../../docs/performance.md';
import phonemeMapping from '../../../../docs/phoneme-mapping.md';
import spellingEvolution from '../../../../docs/spelling-evolution.md';
import spellingReformComparison from '../../../../docs/spelling-reform-comparison.md';
import troubleshooting from '../../../../docs/troubleshooting.md';
import identicalWordsAnalysis from '../../../../docs/identical-words-analysis.md';
import collisionAnalysis from '../../../../docs/collision-analysis.md';

interface DocEntry {
  id: string;
  title: string;
  content: string;
  filename?: string; // undefined for auto-generated docs
  firstInSection?: boolean; // adds visual separator before this item
}

const GITHUB_EDIT_BASE = 'https://github.com/ptarjan/ingglish/edit/main/docs/';

const docs: DocEntry[] = [
  {
    id: 'design-decisions',
    title: 'Design Decisions',
    content: designDecisions,
    filename: 'design-decisions.md',
  },
  {
    id: 'phoneme-mapping',
    title: 'Phoneme Mapping',
    content: phonemeMapping,
    filename: 'phoneme-mapping.md',
  },
  {
    id: 'orthography-comparison',
    title: 'Orthography Comparison',
    content: orthographyComparison,
    filename: 'orthography-comparison.md',
  },
  {
    id: 'spelling-reform-comparison',
    title: 'Spelling Reform History',
    content: spellingReformComparison,
    filename: 'spelling-reform-comparison.md',
  },
  {
    id: 'spelling-evolution',
    title: 'Spelling Evolution',
    content: spellingEvolution,
    filename: 'spelling-evolution.md',
  },
  {
    id: 'identical-words-analysis',
    title: 'Identical Words Analysis',
    content: identicalWordsAnalysis,
    filename: 'identical-words-analysis.md',
  },
  {
    id: 'collision-analysis',
    title: 'Collision Analysis',
    content: collisionAnalysis,
    filename: 'collision-analysis.md',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    content: architecture,
    filename: 'architecture.md',
    firstInSection: true,
  },
  { id: 'api-reference', title: 'API Reference', content: apiReference }, // auto-generated
  {
    id: 'performance',
    title: 'Performance',
    content: performanceDoc,
    filename: 'performance.md',
  },
  { id: 'deployment', title: 'Deployment', content: deploymentDoc, filename: 'deployment.md' },
  { id: 'contributing', title: 'Contributing', content: contributing, filename: 'contributing.md' },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    content: troubleshooting,
    filename: 'troubleshooting.md',
  },
];

// Map filenames to doc IDs for link handling
const filenameToId: Record<string, string> = {};
for (const doc of docs) {
  if (doc.filename !== undefined) {
    filenameToId[doc.filename] = doc.id;
  }
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function extractHeadings(html: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  // Match h2 and h3 tags and extract their full content (including nested HTML like links)
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    // Strip HTML tags and decode entities to get plain text
    const rawText = match[2].replace(/<[^>]+>/g, '').trim();
    const text = decodeHtmlEntities(rawText);
    const id = text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    headings.push({ id, text, level });
  }
  return headings;
}

function parseDocsHash(): { docId: string | null; sectionId: string | null } {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('docs/')) {
    const path = hash.slice(5);
    const slashIndex = path.indexOf('/');
    if (slashIndex !== -1) {
      return { docId: path.slice(0, slashIndex), sectionId: path.slice(slashIndex + 1) };
    }
    return { docId: path, sectionId: null };
  }
  return { docId: null, sectionId: null };
}

function Docs(): JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeDoc, setActiveDoc] = useState(() => {
    const { docId } = parseDocsHash();
    if (docId !== null && docs.some((d) => d.id === docId)) {
      return docId;
    }
    return docs[0].id;
  });

  const currentDoc = docs.find((d) => d.id === activeDoc) ?? docs[0];

  // Extract headings from current doc for TOC
  const currentHeadings = useMemo(() => extractHeadings(currentDoc.content), [currentDoc.content]);

  // Process links and headings after HTML is rendered
  useEffect(() => {
    const container = contentRef.current;
    if (container === null) {
      return;
    }

    // Add IDs to headings
    container.querySelectorAll('h1, h2, h3, h4').forEach((heading) => {
      const text = heading.textContent ?? '';
      const id = text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      heading.id = id;
    });

    // Transform links
    container.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === null || href === '') {
        return;
      }

      // Transform .md links to hash links
      if (href.includes('.md')) {
        const [mdPath, section] = href.split('#');
        const filename = mdPath.split('/').pop() ?? '';
        const docId = filenameToId[filename];
        if (docId !== undefined) {
          link.setAttribute('href', section ? `#docs/${docId}/${section}` : `#docs/${docId}`);
          return;
        }
      }

      // Anchor links - transform to full docs path
      if (href.startsWith('#')) {
        const sectionId = href.slice(1);
        link.setAttribute('href', `#docs/${activeDoc}/${sectionId}`);
        return;
      }

      // External links open in new tab
      if (!href.startsWith('#')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }, [activeDoc, currentDoc.content]);

  // Update URL hash when switching docs
  useEffect(() => {
    const { docId: currentDocId, sectionId } = parseDocsHash();
    if (currentDocId !== activeDoc) {
      window.location.hash = `docs/${activeDoc}`;
    } else if (sectionId === null) {
      window.location.hash = `docs/${activeDoc}`;
    }
  }, [activeDoc]);

  // Scroll to section on initial load
  useEffect(() => {
    const { sectionId } = parseDocsHash();
    if (sectionId !== null) {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView();
      }, 100);
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const { docId, sectionId } = parseDocsHash();
      if (docId !== null && docs.some((d) => d.id === docId)) {
        setActiveDoc(docId);
        if (sectionId !== null) {
          setTimeout(() => {
            document.getElementById(sectionId)?.scrollIntoView();
          }, 100);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <ul>
          {docs.map((doc) => (
            <li key={doc.id} className={doc.firstInSection === true ? 'docs-section-start' : ''}>
              <a
                href={`#docs/${doc.id}`}
                className={`docs-nav-item ${activeDoc === doc.id ? 'active' : ''}`}
              >
                {doc.title}
              </a>
              {activeDoc === doc.id && currentHeadings.length > 0 && (
                <ul className="docs-subsections">
                  {currentHeadings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#docs/${doc.id}/${heading.id}`}
                        className={`docs-subsection-link docs-subsection-h${heading.level}`}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <article className="docs-content">
        {currentDoc.filename !== undefined && (
          <div className="docs-header">
            <a
              href={`${GITHUB_EDIT_BASE}${currentDoc.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="docs-edit-link"
            >
              Edit on GitHub
            </a>
          </div>
        )}
        <div ref={contentRef} dangerouslySetInnerHTML={{ __html: currentDoc.content }} />
      </article>
    </div>
  );
}

export default Docs;
