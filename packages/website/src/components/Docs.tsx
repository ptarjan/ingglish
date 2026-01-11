import { useState } from 'react';
import Markdown from 'react-markdown';

// Import markdown files at build time
import apiReference from '../../../../docs/api-reference.md?raw';
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
}

const docs: DocEntry[] = [
  { id: 'architecture', title: 'Architecture', content: architecture },
  { id: 'api-reference', title: 'API Reference', content: apiReference },
  { id: 'phoneme-mapping', title: 'Phoneme Mapping', content: phonemeMapping },
  { id: 'extension-setup', title: 'Extension Setup', content: extensionSetup },
  { id: 'deployment', title: 'Deployment', content: deployment },
  { id: 'contributing', title: 'Contributing', content: contributing },
  { id: 'debugging', title: 'Debugging', content: debugging },
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
        <Markdown>{currentDoc.content}</Markdown>
      </article>
    </div>
  );
}

export default Docs;
