import React, { useState, useEffect } from 'react';
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

function getDocIdFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith('docs/')) {
    return hash.slice(5); // Remove 'docs/' prefix
  }
  return null;
}

function getTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('');
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return getTextFromChildren(children.props.children);
  }
  return '';
}

function createHeadingId(children: React.ReactNode): string {
  return getTextFromChildren(children)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function Docs(): React.JSX.Element {
  const [activeDoc, setActiveDoc] = useState(() => {
    const hashDocId = getDocIdFromHash();
    if (hashDocId !== null && docs.some((d) => d.id === hashDocId)) {
      return hashDocId;
    }
    return docs[0].id;
  });

  // Update URL hash when switching docs
  useEffect(() => {
    window.location.hash = `docs/${activeDoc}`;
  }, [activeDoc]);

  // Handle browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      const hashDocId = getDocIdFromHash();
      if (hashDocId !== null && docs.some((d) => d.id === hashDocId)) {
        setActiveDoc(hashDocId);
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
      // Handle anchor links (smooth scroll)
      if (href?.startsWith('#') === true) {
        return (
          <a
            href={href}
            onClick={(e) => {
              e.preventDefault();
              const id = href.slice(1);
              const element = document.getElementById(id);
              if (element !== null) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            {...props}
          >
            {children}
          </a>
        );
      }
      // Handle .md links (transform to hash links, let browser handle navigation)
      if (href?.endsWith('.md') === true) {
        const filename = href.split('/').pop() ?? '';
        const docId = filenameToId[filename];
        if (docId !== undefined) {
          return (
            <a href={`#docs/${docId}`} {...props}>
              {children}
            </a>
          );
        }
      }
      // External links
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    h1: ({ children, ...props }) => {
      const id = createHeadingId(children);
      return (
        <h1 id={id} {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = createHeadingId(children);
      return (
        <h2 id={id} {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = createHeadingId(children);
      return (
        <h3 id={id} {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = createHeadingId(children);
      return (
        <h4 id={id} {...props}>
          {children}
        </h4>
      );
    },
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
