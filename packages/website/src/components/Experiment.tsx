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
    copyShare(mapping.shareUrl);
  }, [copyShare, mapping.shareUrl]);

  return (
    <div className="experiment-page">
      <div className="experiment-intro">
        <p>
          Create your own phoneme-to-spelling mapping and see how it translates English text.
          Customize any sound's spelling, then test with sample passages and compare statistics
          against the default Ingglish mapping.
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
