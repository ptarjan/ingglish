import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
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
import type { DocId } from '../routes';
import { DOC_ENTRIES, sitePath, siteUrl } from '../routes';

// The sidebar list below carries each doc's content and short label; its
// search-facing title and description live in routes.ts, shared with the
// build-time HTML so the pre-rendered <head> and the SPA's cannot disagree.
const DOC_SEO = new Map(
  DOC_ENTRIES.map((e) => [e.id, { description: e.seoDescription, title: e.seoTitle }])
);

interface DocEntry {
  content: string;
  filename?: string; // undefined for auto-generated docs
  id: DocId;
  section?: string; // section header label shown before this item (when it's first in its group)
  title: string;
}

interface HeadingInfo {
  id: string;
  level: number;
  text: string;
}

const docs: DocEntry[] = [
  // Ingglish Design — how the project works
  {
    content: designDecisions,
    filename: 'design-decisions.md',
    id: 'design-decisions',
    section: 'Ingglish Design',
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
  // English Spelling — standalone reference guides
  {
    content: englishSpellingRules,
    filename: 'english-spelling-rules.md',
    id: 'how-to-read-english',
    section: 'English Spelling',
    title: 'Reading: Letters to Sounds',
  },
  {
    content: englishSpellingChoices,
    filename: 'english-spelling-choices.md',
    id: 'how-to-spell-english',
    title: 'Writing: Sounds to Letters',
  },
  // Development — technical reference
  {
    content: architecture,
    filename: 'architecture.md',
    id: 'architecture',
    section: 'Development',
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
  if (typeof document === 'undefined') {
    // SSR fallback: decode common HTML entities
    return text
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"')
      .replaceAll('&#39;', "'")
      .replaceAll('&nbsp;', ' ');
  }
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Pre-transform all doc content so .md links work without JS
for (const doc of docs) {
  doc.content = transformMdLinks(doc.content);
}

function Docs(): JSX.Element {
  const { docId: paramDocId } = useParams<{ docId?: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);

  // Resolve activeDoc from URL param — default to first doc if param is missing or invalid
  const resolvedDocId =
    paramDocId !== undefined && docs.some((d) => d.id === paramDocId) ? paramDocId : docs[0]!.id;

  const [activeDoc, setActiveDoc] = useState(resolvedDocId);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync activeDoc when URL param changes (e.g. browser back/forward)
  useEffect(() => {
    if (resolvedDocId !== activeDoc) {
      setActiveDoc(resolvedDocId);
    }
  }, [resolvedDocId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll the active pill into view in the horizontal nav
  const activePillRef = useCallback((node: HTMLAnchorElement | null) => {
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  const currentDoc = docs.find((d) => d.id === activeDoc) ?? docs[0]!;
  const seo = DOC_SEO.get(currentDoc.id)!;

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

    // Add SPA click handlers and target attributes to links
    // (.md links are already transformed to /docs/:id paths at module level)
    container.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === null || href === '') {
        return;
      }

      // Internal doc links — add SPA navigation click handler
      if (href.startsWith('/docs/')) {
        const url = new URL(href, globalThis.location.origin);
        const docId = url.pathname.split('/').pop() ?? '';
        const section = url.hash ? url.hash.slice(1) : undefined;
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (section !== undefined && section !== '') {
            void navigate(`${sitePath(`/docs/${docId}`)}#${section}`);
            setTimeout(() => {
              document.querySelector(`#${CSS.escape(section)}`)?.scrollIntoView();
            }, 100);
          } else {
            void navigate(sitePath(`/docs/${docId}`));
            window.scrollTo(0, 0);
          }
        });
        return;
      }

      // Anchor links - use standard #sectionId (stays on current doc page)
      if (href.startsWith('#')) {
        return;
      }

      // External links open in new tab
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }, [activeDoc, currentDoc.content, navigate]);

  // The title is rendered declaratively below (React hoists <title> to <head>),
  // so it stays in lockstep with the description and with the build-time HTML.

  // Scroll to section on initial load
  useEffect(() => {
    const sectionId = globalThis.location.hash ? globalThis.location.hash.slice(1) : null;
    if (sectionId !== null) {
      setTimeout(() => {
        document.querySelector(`#${CSS.escape(sectionId)}`)?.scrollIntoView();
      }, 100);
    }
  }, []);

  const handleDocClick = useCallback(
    (docId: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      void navigate(sitePath(`/docs/${docId}`));
      window.scrollTo(0, 0);
    },
    [navigate]
  );

  const handleHeadingClick = useCallback(
    (docId: string, headingId: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      document.querySelector(`#${CSS.escape(headingId)}`)?.scrollIntoView();
      void navigate(`${sitePath(`/docs/${docId}`)}#${headingId}`);
    },
    [navigate]
  );

  return (
    <>
      <title>{seo.title}</title>
      <meta content={seo.description} name="description" />
      <link href={siteUrl(`/docs/${currentDoc.id}`)} rel="canonical" />
      <div className="docs-container">
        <button
          aria-label={sidebarOpen ? 'Collapse navigation' : 'Expand navigation'}
          className="docs-sidebar-toggle"
          onClick={() => {
            setSidebarOpen((o) => !o);
          }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          type="button"
        >
          {sidebarOpen ? '\u00AB' : '\u00BB'}
        </button>
        <nav className={`docs-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <ul className="hide-scrollbar">
            {docs.map((doc) => (
              <li className={doc.section === undefined ? '' : 'docs-section-start'} key={doc.id}>
                {doc.section !== undefined && (
                  <div className="docs-section-header">{doc.section}</div>
                )}
                <a
                  className={`docs-nav-item ${activeDoc === doc.id ? 'active' : ''}`}
                  href={sitePath(`/docs/${doc.id}`)}
                  onClick={handleDocClick(doc.id)}
                  ref={activeDoc === doc.id ? activePillRef : undefined}
                >
                  {doc.title}
                </a>
                {activeDoc === doc.id && currentHeadings.length > 0 && (
                  <ul className="docs-subsections">
                    {currentHeadings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          className={`docs-subsection-link docs-subsection-h${heading.level}`}
                          href={`${sitePath(`/docs/${doc.id}`)}#${heading.id}`}
                          onClick={handleHeadingClick(doc.id, heading.id)}
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
    // Strip HTML tags and decode entities to get plain text.
    // Loop until stable to handle nested tags.
    let rawText = match[2]!;
    let prev: string;
    do {
      prev = rawText;
      rawText = rawText.replaceAll(/<[^>]+>/g, '');
    } while (rawText !== prev);
    rawText = rawText.trim();
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

/**
 * Replace .md file links with /docs/:id paths in HTML content.
 * Runs at module level so SSG output has correct links without JS.
 */
function transformMdLinks(html: string): string {
  return html.replaceAll(
    /href="([^"]*\.md)(?:#([^"]*))?"/g,
    (_match, mdPath: string, section?: string) => {
      const filename = mdPath.split('/').pop() ?? '';
      const docId = filenameToId[filename];
      if (docId === undefined) {
        return _match;
      }
      const frag = section !== undefined && section !== '' ? `#${section}` : '';
      return `href="${sitePath(`/docs/${docId}`)}${frag}"`;
    }
  );
}

export default Docs;
