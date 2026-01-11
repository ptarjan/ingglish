import type { HTMLAttributes, JSX, ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';

// Import markdown files at build time
import apiReference from '../../../../docs/generated/README.md?raw';
import architecture from '../../../../docs/architecture.md?raw';
import contributing from '../../../../docs/contributing.md?raw';
import debugging from '../../../../docs/debugging.md?raw';
import deployment from '../../../../docs/deployment.md?raw';
import extensionSetup from '../../../../docs/extension-setup.md?raw';
import phonemeMapping from '../../../../docs/phoneme-mapping.md?raw';

interface DocEntry {
  id: string;
  title: string;
  content: string;
  filename?: string; // undefined for auto-generated docs
}

const GITHUB_EDIT_BASE = 'https://github.com/ptarjan/ingglish/edit/main/docs/';

const docs: DocEntry[] = [
  { id: 'architecture', title: 'Architecture', content: architecture, filename: 'architecture.md' },
  { id: 'api-reference', title: 'API Reference', content: apiReference }, // auto-generated
  {
    id: 'phoneme-mapping',
    title: 'Phoneme Mapping',
    content: phonemeMapping,
    filename: 'phoneme-mapping.md',
  },
  {
    id: 'extension-setup',
    title: 'Extension Setup',
    content: extensionSetup,
    filename: 'extension-setup.md',
  },
  { id: 'deployment', title: 'Deployment', content: deployment, filename: 'deployment.md' },
  { id: 'contributing', title: 'Contributing', content: contributing, filename: 'contributing.md' },
  { id: 'debugging', title: 'Debugging', content: debugging, filename: 'debugging.md' },
];

// Map filenames to doc IDs for link handling
const filenameToId: Record<string, string> = {};
for (const doc of docs) {
  if (doc.filename !== undefined) {
    filenameToId[doc.filename] = doc.id;
  }
}

function parseDocsHash(): { docId: string | null; sectionId: string | null } {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('docs/')) {
    const path = hash.slice(5); // Remove 'docs/' prefix
    const slashIndex = path.indexOf('/');
    if (slashIndex !== -1) {
      return { docId: path.slice(0, slashIndex), sectionId: path.slice(slashIndex + 1) };
    }
    return { docId: path, sectionId: null };
  }
  return { docId: null, sectionId: null };
}

function createHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function createHeadingComponent(Tag: 'h1' | 'h2' | 'h3' | 'h4') {
  return ({
    children,
    ...props
  }: HTMLAttributes<HTMLHeadingElement> & { children?: ReactNode }) => {
    const id = typeof children === 'string' ? createHeadingId(children) : undefined;
    return (
      <Tag id={id} {...props}>
        {children}
      </Tag>
    );
  };
}

function Docs(): JSX.Element {
  const [activeDoc, setActiveDoc] = useState(() => {
    const { docId } = parseDocsHash();
    if (docId !== null && docs.some((d) => d.id === docId)) {
      return docId;
    }
    return docs[0].id;
  });

  // Update URL hash when switching docs (preserve section if same doc)
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
      // Wait for markdown to render
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

  const currentDoc = docs.find((d) => d.id === activeDoc) ?? docs[0];

  // Custom components to handle links and add heading IDs
  const components: Components = {
    a: ({ href, children, ...props }) => {
      // Transform .md links (with optional #section) to hash links
      if (href?.includes('.md') === true) {
        const [mdPath, section] = href.split('#');
        const filename = mdPath.split('/').pop() ?? '';
        const docId = filenameToId[filename];
        if (docId !== undefined) {
          const hashPath = section !== undefined ? `#docs/${docId}/${section}` : `#docs/${docId}`;
          return (
            <a href={hashPath} {...props}>
              {children}
            </a>
          );
        }
      }
      // External links open in new tab
      if (href?.startsWith('#') !== true) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      }
      // Anchor links - transform to full docs path for shareability
      const sectionId = href.slice(1);
      return (
        <a href={`#docs/${activeDoc}/${sectionId}`} {...props}>
          {children}
        </a>
      );
    },
    h1: createHeadingComponent('h1'),
    h2: createHeadingComponent('h2'),
    h3: createHeadingComponent('h3'),
    h4: createHeadingComponent('h4'),
  };

  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <ul>
          {docs.map((doc) => (
            <li key={doc.id}>
              <button
                className={`docs-nav-item ${activeDoc === doc.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveDoc(doc.id);
                }}
              >
                {doc.title}
              </button>
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
        <Markdown components={components}>{currentDoc.content}</Markdown>
      </article>
    </div>
  );
}

export default Docs;
