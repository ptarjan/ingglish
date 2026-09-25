import { translateSyncWithMapping } from 'ingglish';
import { memo, useCallback, useDeferredValue, useEffect, useState } from 'react';
import { ALL_SAMPLES, pickSample } from '../data/language-samples';
import { MappedWordDisplay } from './MappedWordDisplay';
import { buildDiffMap } from './diff-map';

const STORAGE_KEY = 'ingglish-experiment-text';

interface ExperimentTranslatorProps {
  version: number;
}

/**
 * The experiment format reads the mapping registered at module level, so its
 * output changes without any prop changing. The parent keys this component by
 * the mapping version: an edit remounts it and retranslates, while memo skips
 * the urgent renders where only the not-yet-deferred text changed.
 */
const ExperimentOutput = memo(function ExperimentOutput({ text }: { text: string }) {
  const tokens = translateSyncWithMapping(text, { format: 'experiment' });
  return (
    <div className="experiment-output">
      <div className="label-caps experiment-output-label">Translated:</div>
      <MappedWordDisplay
        className="experiment-words"
        diffMap={buildDiffMap(tokens, text, 'experiment')}
        showTooltip
        tokens={tokens}
      />
    </div>
  );
});

function ExperimentTranslator({ version }: ExperimentTranslatorProps) {
  const [text, setText] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '');

  useEffect(() => {
    if (text.length > 0) {
      localStorage.setItem(STORAGE_KEY, text);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [text]);

  const deferredText = useDeferredValue(text);

  const enSamples = ALL_SAMPLES.en!;

  const handleSample = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const index = Number.parseInt(e.target.value, 10);
      if (!Number.isNaN(index) && enSamples[index] !== undefined) {
        setText(enSamples[index].text);
      }
    },
    [enSamples]
  );

  const handleRandom = useCallback(() => {
    const sample = pickSample('en', text);
    if (sample) {
      setText(sample);
    }
  }, [text]);

  const hasContent = text.trim().length > 0;
  const selectedIndex = enSamples.findIndex((p) => p.text === text);

  return (
    <div className="card experiment-translator">
      <div className="experiment-translator-header">
        <h3>Try it</h3>
        <select
          aria-label="Load sample passage"
          className="sample-select"
          onChange={handleSample}
          value={selectedIndex === -1 ? '' : String(selectedIndex)}
        >
          <option disabled value="">
            Load a sample…
          </option>
          {enSamples.map((p, i) => (
            <option key={i} value={i}>
              {p.label}
            </option>
          ))}
        </select>
        <button className="btn-secondary" onClick={handleRandom}>
          Random
        </button>
      </div>

      <textarea
        className="text-input experiment-input"
        onChange={(e) => {
          setText(e.target.value);
        }}
        placeholder="Type or paste English text here…"
        rows={4}
        spellCheck={false}
        value={text}
      />

      {hasContent && <ExperimentOutput key={version} text={deferredText} />}
    </div>
  );
}

export default ExperimentTranslator;
