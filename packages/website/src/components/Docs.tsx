import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
// Import markdown files - vite-plugin-md converts to HTML at build time
import architecture from '../../../../docs/architecture.md';
import communityLandscape from '../../../../docs/community-landscape.md';
import contributing from '../../../../docs/contributing.md';
import deploymentDoc from '../../../../docs/deployment.md';
import designDecisions from '../../../../docs/design-decisions.md';
import dialectAssumptions from '../../../../docs/dialect-assumptions.md';
import englishSpellingChoices from '../../../../docs/english-spelling-choices.md';
import englishSpellingRules from '../../../../docs/english-spelling-rules.md';
import falseFriends from '../../../../docs/false-friends.md';
import apiReference from '../../../../docs/generated/README.md';
import identicalWordsAnalysis from '../../../../docs/identical-words-analysis.md';
import metricsDoc from '../../../../docs/metrics.md';
import morphologicalAnalysis from '../../../../docs/morphological-analysis.md';
import orthographicTransparency from '../../../../docs/orthographic-transparency.md';
import orthographyComparison from '../../../../docs/orthography-comparison.md';
import performanceDoc from '../../../../docs/performance.md';
import phonemeMapping from '../../../../docs/phoneme-mapping.md';
import spellingIteration from '../../../../docs/spelling-iteration.md';
import spellingReformComparison from '../../../../docs/spelling-reform-comparison.md';
import troubleshooting from '../../../../docs/troubleshooting.md';

interface DocEntry {
  content: string;
  filename?: string; // undefined for auto-generated docs
  firstInSection?: boolean; // adds visual separator before this item
  id: string;
  title: string;
}

interface HeadingInfo {
  id: string;
  level: number;
  text: string;
}

const GITHUB_EDIT_BASE = 'https://github.com/ptarjan/ingglish/edit/main/docs/';

const docs: DocEntry[] = [
  {
    content: designDecisions,
    filename: 'design-decisions.md',
    id: 'design-decisions',
    title: 'Design Decisions',
  },
  {
    content: phonemeMapping,
    filename: 'phoneme-mapping.md',
    id: 'phoneme-mapping',
    title: 'Phoneme Mapping',
  },
  {
    content: orthographyComparison,
    filename: 'orthography-comparison.md',
    id: 'orthography-comparison',
    title: 'Orthography Comparison',
  },
  {
    content: spellingReformComparison,
    filename: 'spelling-reform-comparison.md',
    id: 'spelling-reform-comparison',
    title: 'Spelling Reform History',
  },
  {
    content: communityLandscape,
    filename: 'community-landscape.md',
    id: 'community-landscape',
    title: 'Community Landscape',
  },
  {
    content: spellingIteration,
    filename: 'spelling-iteration.md',
    id: 'spelling-iteration',
    title: 'Spelling Iteration Log',
  },
  {
    content: identicalWordsAnalysis,
    filename: 'identical-words-analysis.md',
    id: 'identical-words-analysis',
    title: 'Identical Words Analysis',
  },
  {
    content: metricsDoc,
    filename: 'metrics.md',
    id: 'metrics',
    title: 'Mapping Quality Metrics',
  },
  {
    content: falseFriends,
    filename: 'false-friends.md',
    id: 'false-friends',
    title: 'False Friends Analysis',
  },
  {
    content: orthographicTransparency,
    filename: 'orthographic-transparency.md',
    id: 'orthographic-transparency',
    title: 'Orthographic Transparency',
  },
  {
    content: morphologicalAnalysis,
    filename: 'morphological-analysis.md',
    id: 'morphological-analysis',
    title: 'Morphological Analysis',
  },
  {
    content: dialectAssumptions,
    filename: 'dialect-assumptions.md',
    id: 'dialect-assumptions',
    title: 'Dialect Assumptions',
  },
  {
    content: englishSpellingRules,
    filename: 'english-spelling-rules.md',
    id: 'how-to-read-english',
    title: 'Reading: Letters to Sounds',
  },
  {
    content: englishSpellingChoices,
    filename: 'english-spelling-choices.md',
    id: 'how-to-spell-english',
    title: 'Writing: Sounds to Letters',
  },
  {
    content: architecture,
    filename: 'architecture.md',
    firstInSection: true,
    id: 'architecture',
    title: 'Architecture',
  },
  { content: apiReference, id: 'api-reference', title: 'API Reference' }, // auto-generated
  {
    content: performanceDoc,
    filename: 'performance.md',
    id: 'performance',
    title: 'Performance',
  },
  { content: deploymentDoc, filename: 'deployment.md', id: 'deployment', title: 'Deployment' },
  { content: contributing, filename: 'contributing.md', id: 'contributing', title: 'Contributing' },
  {
    content: troubleshooting,
    filename: 'troubleshooting.md',
    id: 'troubleshooting',
    title: 'Troubleshooting',
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

function Docs(): JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeDoc, setActiveDoc] = useState(() => {
    const { docId } = parseDocsPath();
    if (docId !== null && docs.some((d) => d.id === docId)) {
      return docId;
    }
    return docs[0]!.id;
  });

  const currentDoc = docs.find((d) => d.id === activeDoc) ?? docs[0]!;

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
        .replaceAll(/[^\w\s-]/g, '')
        .replaceAll(/\s+/g, '-')
        .replaceAll(/-{2,}/g, '-')
        .replaceAll(/^-|-$/g, '');
      heading.id = id;
    });

    // Transform links
    container.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === null || href === '') {
        return;
      }

      // Transform .md links to path-based links with SPA navigation
      if (href.includes('.md')) {
        const [mdPath, section] = href.split('#') as [string, string | undefined];
        const filename = mdPath.split('/').pop() ?? '';
        const docId = filenameToId[filename];
        if (docId !== undefined) {
          link.setAttribute(
            'href',
            section !== undefined && section !== '' ? `/docs/${docId}#${section}` : `/docs/${docId}`
          );
          link.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveDoc(docId);
            if (section !== undefined && section !== '') {
              setTimeout(() => {
                document.querySelector(`#${CSS.escape(section)}`)?.scrollIntoView();
              }, 100);
            } else {
              window.scrollTo(0, 0);
            }
          });
          return;
        }
      }

      // Anchor links - use standard #sectionId (stays on current doc page)
      if (href.startsWith('#')) {
        return;
      }

      // External links open in new tab
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }, [activeDoc, currentDoc.content]);

  // Update URL path when switching docs
  useEffect(() => {
    const targetPath = `/docs/${activeDoc}`;
    if (globalThis.location.pathname !== targetPath) {
      globalThis.history.pushState(null, '', targetPath);
    }
  }, [activeDoc]);

  // Scroll to section on initial load
  useEffect(() => {
    const { sectionId } = parseDocsPath();
    if (sectionId !== null) {
      setTimeout(() => {
        document.querySelector(`#${CSS.escape(sectionId)}`)?.scrollIntoView();
      }, 100);
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const { docId, sectionId } = parseDocsPath();
      if (docId !== null && docs.some((d) => d.id === docId)) {
        setActiveDoc(docId);
        if (sectionId !== null) {
          setTimeout(() => {
            document.querySelector(`#${CSS.escape(sectionId)}`)?.scrollIntoView();
          }, 100);
        }
      }
    };
    globalThis.addEventListener('popstate', handlePopState);
    return () => {
      globalThis.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <>
      <title>{currentDoc.title} | Ingglish Docs</title>
      <meta
        content={`Ingglish documentation — ${currentDoc.title}. Technical reference for the phonemic English spelling system.`}
        name="description"
      />
      <link href={`https://ingglish.com/docs/${currentDoc.id}`} rel="canonical" />
      <div className="docs-container">
        <nav className="docs-sidebar">
          <ul>
            {docs.map((doc) => (
              <li className={doc.firstInSection === true ? 'docs-section-start' : ''} key={doc.id}>
                <a
                  className={`docs-nav-item ${activeDoc === doc.id ? 'active' : ''}`}
                  href={`/docs/${doc.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveDoc(doc.id);
                    window.scrollTo(0, 0);
                  }}
                >
                  {doc.title}
                </a>
                {activeDoc === doc.id && currentHeadings.length > 0 && (
                  <ul className="docs-subsections">
                    {currentHeadings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          className={`docs-subsection-link docs-subsection-h${heading.level}`}
                          href={`/docs/${doc.id}#${heading.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            document.querySelector(`#${CSS.escape(heading.id)}`)?.scrollIntoView();
                            globalThis.history.pushState(null, '', `/docs/${doc.id}#${heading.id}`);
                          }}
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
                className="docs-edit-link"
                href={`${GITHUB_EDIT_BASE}${currentDoc.filename}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Edit on GitHub
              </a>
            </div>
          )}
          <div dangerouslySetInnerHTML={{ __html: currentDoc.content }} ref={contentRef} />
        </article>
      </div>
    </>
  );
}

function extractHeadings(html: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  // Match h2 and h3 tags and extract their full content (including nested HTML like links)
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = Number.parseInt(match[1]!, 10);
    // Strip HTML tags and decode entities to get plain text
    const rawText = match[2]!.replaceAll(/<[^>]+>/g, '').trim();
    const text = decodeHtmlEntities(rawText);
    const id = text
      .toLowerCase()
      .replaceAll(/[^\w\s-]/g, '')
      .replaceAll(/\s+/g, '-')
      .replaceAll(/-{2,}/g, '-')
      .replaceAll(/^-|-$/g, '');
    headings.push({ id, level, text });
  }
  return headings;
}

function parseDocsPath(): { docId: null | string; sectionId: null | string } {
  // Path: /docs/architecture → docId = 'architecture'
  // Hash: #section → sectionId = 'section' (standard anchor scroll)
  const segments = globalThis.location.pathname.replace(/\/$/, '').split('/');
  // segments: ['', 'docs', 'architecture']
  const docId = segments[2] ?? null;
  const sectionId = globalThis.location.hash ? globalThis.location.hash.slice(1) : null;
  return { docId, sectionId };
}

export default Docs;
