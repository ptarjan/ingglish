import { useCallback } from 'react';
import { trackExperimentReset } from '../analytics';
import { LANGUAGE_PRESETS } from '../data/language-presets';
import { useCustomMapping } from '../hooks/useCustomMapping';
import { useShare } from '../hooks/useShare';
import ExperimentTranslator from './ExperimentTranslator';
import MappingEditor from './MappingEditor';
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

      <div className="experiment-presets">
        <span className="presets-label">Use a language's orthography:</span>
        {LANGUAGE_PRESETS.map((preset) => {
          const isActive = decodeURIComponent(globalThis.location.hash) === preset.hash;
          return (
            <a
              className={`preset-link${isActive ? ' preset-active' : ''}`}
              href={`/experiment${preset.hash}`}
              key={preset.label}
              onClick={(e) => {
                e.preventDefault();
                globalThis.location.hash = preset.hash;
              }}
              title={preset.description}
            >
              {preset.label}
            </a>
          );
        })}
      </div>

      <div className="experiment-share-bar">
        <button
          className="btn-secondary"
          disabled={!mapping.hasCustomizations}
          onClick={handleReset}
        >
          Reset to Defaults
        </button>
        <button
          className={`btn-secondary ${copiedShare ? 'btn-copied' : ''}`}
          onClick={handleShare}
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
