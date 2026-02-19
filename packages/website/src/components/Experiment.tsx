import { useCallback } from 'react';
import { useCustomMapping } from '../hooks/useCustomMapping';
import { useClipboard } from '../hooks/useClipboard';
import MappingEditor from './MappingEditor';
import ExperimentTranslator from './ExperimentTranslator';
import MappingStats from './MappingStats';

function Experiment() {
  const mapping = useCustomMapping();
  const [copiedShare, copyShare] = useClipboard();

  const handleShare = useCallback(() => {
    if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: 'My custom Ingglish spelling',
          text: 'Check out my custom phonetic spelling mapping!',
          url: mapping.shareUrl,
        })
        .catch(() => {
          // User cancelled or share failed — fall back to clipboard
          copyShare(mapping.shareUrl);
        });
    } else {
      copyShare(mapping.shareUrl);
    }
  }, [copyShare, mapping.shareUrl]);

  return (
    <div className="experiment-page">
      <div className="experiment-intro">
        <p>
          Design your own phonetic spelling system. Click any cell in the <strong>Spelling</strong>{' '}
          column to change how a sound is written, then see your changes applied to sample text on
          the right.
        </p>
      </div>

      <div className="experiment-share-bar">
        <button
          onClick={mapping.reset}
          className="btn-secondary"
          disabled={!mapping.hasCustomizations}
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleShare}
          className={`btn-secondary ${copiedShare ? 'btn-copied' : ''}`}
        >
          {copiedShare ? 'Copied!' : 'Share Link'}
        </button>
      </div>

      <div className="experiment-grid">
        <div className="experiment-left">
          <MappingEditor mapping={mapping} />
        </div>
        <div className="experiment-right">
          <ExperimentTranslator version={mapping.version} />
          <MappingStats version={mapping.version} />
        </div>
      </div>
    </div>
  );
}

export default Experiment;
