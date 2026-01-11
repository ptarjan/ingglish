import { useState } from 'react';
import Markdown from 'react-markdown';

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
  { id: 'phoneme-mapping', title: 'Phoneme Mapping', content: phonemeMapping, filename: 'phoneme-mapping.md' },
  { id: 'extension-setup', title: 'Extension Setup', content: extensionSetup, filename: 'extension-setup.md' },
  { id: 'deployment', title: 'Deployment', content: deployment, filename: 'deployment.md' },
  { id: 'contributing', title: 'Contributing', content: contributing, filename: 'contributing.md' },
  { id: 'debugging', title: 'Debugging', content: debugging, filename: 'debugging.md' },
];

function Docs(): React.JSX.Element {
  const [activeDoc, setActiveDoc] = useState(docs[0].id);

  const currentDoc = docs.find((d) => d.id === activeDoc) ?? docs[0];

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
        {currentDoc.filename && (
          <div className="docs-header">
            <a
              href={`${GITHUB_EDIT_BASE}${currentDoc.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="docs-edit-button"
            >
              Edit on GitHub
            </a>
          </div>
        )}
        <Markdown>{currentDoc.content}</Markdown>
      </article>
    </div>
  );
}

export default Docs;
