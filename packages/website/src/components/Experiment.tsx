import { useCallback } from 'react';
import { useCustomMapping } from '../hooks/useCustomMapping';
import { useShare } from '../hooks/useShare';
import { trackExperimentReset } from '../analytics';
import MappingEditor from './MappingEditor';
import ExperimentTranslator from './ExperimentTranslator';
import MappingStats from './MappingStats';

function Experiment() {
  const mapping = useCustomMapping();
  const [copiedShare, shareLink] = useShare();

  const handleReset = useCallback(() => {
    mapping.reset();
    trackExperimentReset();
  }, [mapping]);

  const handleShare = useCallback(() => {
    shareLink(
      mapping.shareUrl,
      'My custom Ingglish spelling',
      'Check out my custom phonetic spelling mapping!'
    );
  }, [shareLink, mapping.shareUrl]);

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
          onClick={handleReset}
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
