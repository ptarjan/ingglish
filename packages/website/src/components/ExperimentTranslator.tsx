import { type TranslatedToken, translateSyncWithMapping } from 'ingglish';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ALL_SAMPLES, pickSample } from '../data/foreign-samples';
import { MappedWordDisplay } from './MappedWordDisplay';
import { buildDiffMap } from './diff-map';

const STORAGE_KEY = 'ingglish-experiment-text';

interface ExperimentTranslatorProps {
  version: number;
}

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

  // translateSyncWithMapping is a stable module-level function whose output
  // changes when the experiment mapping is updated. We capture `version` so
  // React re-computes this memo on every mapping edit.
  const { diffMap, tokens } = useMemo(() => {
    void version;
    if (deferredText.trim().length === 0) {
      return { diffMap: undefined, tokens: [] as TranslatedToken[] };
    }
    const expTokens = translateSyncWithMapping(deferredText, 'experiment');
    return { diffMap: buildDiffMap(expTokens, deferredText, 'experiment'), tokens: expTokens };
  }, [deferredText, version]);

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
    <div className="experiment-translator">
      <div className="experiment-translator-header">
        <h3>Test</h3>
        <select
          aria-label="Load sample passage"
          className="sample-select"
          onChange={handleSample}
          value={selectedIndex === -1 ? '' : String(selectedIndex)}
        >
          <option disabled value="">
            Load sample...
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
        placeholder="Type or paste English text here..."
        rows={4}
        spellCheck={false}
        value={text}
      />

      {hasContent && (
        <div className="experiment-output">
          <div className="experiment-output-label">Translated:</div>
          <MappedWordDisplay
            className="experiment-words"
            diffMap={diffMap}
            showTooltip
            tokens={tokens}
          />
        </div>
      )}
    </div>
  );
}

export default ExperimentTranslator;
