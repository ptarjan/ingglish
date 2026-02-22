import { useState, useMemo, useDeferredValue, useCallback, useEffect } from 'react';
import { translateSyncWithMapping, type TranslatedToken } from 'ingglish';
import { MappedWordDisplay } from './MappedWordDisplay';
import { buildDiffMap } from '../utils/diff-map';
import { SAMPLE_PASSAGES, pickRandomPassage } from '../utils/sample-text';

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
  const { tokens, diffMap } = useMemo(() => {
    void version;
    if (deferredText.trim().length === 0) {
      return { tokens: [] as TranslatedToken[], diffMap: undefined };
    }
    const expTokens = translateSyncWithMapping(deferredText, 'experiment');
    return { tokens: expTokens, diffMap: buildDiffMap(expTokens, deferredText, 'experiment') };
  }, [deferredText, version]);

  const handleSample = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10);
    if (!isNaN(index) && SAMPLE_PASSAGES[index] !== undefined) {
      setText(SAMPLE_PASSAGES[index].text);
    }
  }, []);

  const handleRandom = useCallback(() => {
    setText(pickRandomPassage(text));
  }, [text]);

  const hasContent = text.trim().length > 0;
  const selectedIndex = SAMPLE_PASSAGES.findIndex((p) => p.text === text);

  return (
    <div className="experiment-translator">
      <div className="experiment-translator-header">
        <h3>Test</h3>
        <select
          onChange={handleSample}
          value={selectedIndex >= 0 ? String(selectedIndex) : ''}
          className="sample-select"
          aria-label="Load sample passage"
        >
          <option value="" disabled>
            Load sample...
          </option>
          {SAMPLE_PASSAGES.map((p, i) => (
            <option key={i} value={i}>
              {p.label}
            </option>
          ))}
        </select>
        <button onClick={handleRandom} className="btn-secondary">
          Random
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
        }}
        placeholder="Type or paste English text here..."
        className="text-input experiment-input"
        spellCheck={false}
        rows={4}
      />

      {hasContent && (
        <div className="experiment-output">
          <div className="experiment-output-label">Translated:</div>
          <MappedWordDisplay
            tokens={tokens}
            diffMap={diffMap}
            showTooltip
            className="experiment-words"
          />
        </div>
      )}
    </div>
  );
}

export default ExperimentTranslator;
