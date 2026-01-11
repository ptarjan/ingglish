import React, { useState } from 'react';
import Markdown from 'react-markdown';
import type { Components } from 'react-markdown';

// Import markdown files at build time
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
  const [activeDoc, setActiveDoc] = useState(docs[0].id);

  const currentDoc = docs.find((d) => d.id === activeDoc) ?? docs[0];

  // Custom components to handle links and add heading IDs
  const components: Components = {
    a: ({ href, children, ...props }) => {
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
