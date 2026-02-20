import { useState, useCallback, useMemo, useEffect } from 'react';
import { loadReverseDictionary } from '@ingglish/dictionary';
import { getFormatLabel } from '@ingglish/phonemes';
import { useFormat } from '../contexts/FormatContext';
import { analyzeWord, fallbackLabel, formatFrequency } from './word-explorer/analyze';
import {
  PhonemeChain,
  G2PRuleTrace,
  CompoundBreakdown,
  StemmingBreakdown,
  InitialismBreakdown,
  BritishBreakdown,
  HomophoneList,
} from './word-explorer/breakdowns';

function getInitialWord(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('word') ?? '';
}

export default function WordExplorer() {
  const { format, toggleFormat } = useFormat();
  const [input, setInput] = useState(getInitialWord);
  const [reverseDictReady, setReverseDictReady] = useState(false);
  const formatLabel = getFormatLabel(format);

  // Load reverse dictionary on mount (needed for homophone lookups)
  useEffect(() => {
    void loadReverseDictionary().then(() => {
      setReverseDictReady(true);
    });
  }, []);

  const results = useMemo(() => {
    if (!reverseDictReady) {
      return [];
    }
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return [];
    }
    // Split on spaces to support multi-word lookups
    return trimmed.split(/\s+/).map((w) => analyzeWord(w, format));
  }, [input, format, reverseDictReady]);

  const handleWordClick = useCallback((word: string) => {
    setInput(word);
  }, []);

  return (
    <div className="word-explorer">
      <div className="guide-intro">
        <h2>Word Explorer</h2>
        <p>
          Look up any English word to see its full translation pipeline: spelling &rarr; phonemes
          &rarr; IPA &rarr; {formatLabel}. See homophones, frequency data, and how each phoneme
          maps.
        </p>
      </div>

      <div className="explorer-input-row">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder={
            reverseDictReady
              ? 'Type a word (e.g., knight, treehouse, URL)'
              : 'Loading dictionary...'
          }
          className="explorer-input"
          spellCheck={false}
          disabled={!reverseDictReady}
        />
        <button type="button" className="btn-secondary" onClick={toggleFormat}>
          {formatLabel} &#x21C5;
        </button>
      </div>

      {results.length === 0 && input.trim().length === 0 && (
        <div className="explorer-empty">
          <p>Try some interesting words:</p>
          <div className="suggestion-chips">
            {['colonel', 'treehouse', 'ghosting', 'URL', 'favourable', 'psychology'].map((w) => (
              <button
                key={w}
                className="suggestion-chip"
                onClick={() => {
                  setInput(w);
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.map((result) => (
        <div key={result.word} className="word-card">
          <div className="word-card-header">
            <div className="word-main">
              <span className="word-english">{result.word}</span>
              <span className="word-arrow">&rarr;</span>
              <span className="word-translated">{result.formatted}</span>
            </div>
            <div className="word-ipa">/{result.ipa}/</div>
          </div>

          <div className="word-meta">
            <span className={`badge ${result.matched ? 'badge-dict' : 'badge-fallback'}`}>
              {result.isCustom
                ? 'custom override'
                : result.matched
                  ? 'dictionary'
                  : fallbackLabel(result.fallbackStrategy)}
            </span>
            {result.britishSpelling !== undefined && result.fallbackStrategy !== 'british' && (
              <span className="badge badge-fallback">British variant</span>
            )}
            {result.frequency !== undefined && (
              <span className="badge badge-freq">freq: {formatFrequency(result.frequency)}</span>
            )}
            {result.homophones.length > 0 && (
              <span className="badge badge-homo">
                {result.homophones.length} homophone{result.homophones.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {result.g2pTrace !== undefined && (
            <div className="explorer-section">
              <h4>G2P Rules Applied</h4>
              <G2PRuleTrace trace={result.g2pTrace} format={format} />
            </div>
          )}

          {result.compoundParts !== undefined && (
            <CompoundBreakdown
              parts={result.compoundParts}
              format={format}
              onWordClick={handleWordClick}
            />
          )}

          {result.stemmingResult !== undefined && (
            <StemmingBreakdown
              result={result.stemmingResult}
              format={format}
              onWordClick={handleWordClick}
            />
          )}

          {result.fallbackStrategy === 'initialism' && (
            <InitialismBreakdown word={result.word} format={format} />
          )}

          {result.britishSpelling !== undefined && (
            <BritishBreakdown
              original={result.word}
              american={result.britishSpelling}
              format={format}
              onWordClick={handleWordClick}
            />
          )}

          {result.phonemes !== null && (
            <div className="explorer-section">
              <h4>Phoneme-by-Phoneme Mapping</h4>
              <PhonemeChain phonemes={result.phonemes} format={format} />
            </div>
          )}

          {format !== 'ingglish' && result.phonemes !== null && (
            <div className="explorer-section">
              <h4>All Formats</h4>
              <div className="format-comparison">
                <div className="format-item">
                  <span className="format-label">Ingglish</span>
                  <span className="format-value mono">{result.ingglish}</span>
                </div>
                <div className="format-item">
                  <span className="format-label">IPA</span>
                  <span className="format-value mono">/{result.ipa}/</span>
                </div>
                <div className="format-item">
                  <span className="format-label">{formatLabel}</span>
                  <span className="format-value mono">{result.formatted}</span>
                </div>
              </div>
            </div>
          )}

          <HomophoneList
            homophones={result.homophones}
            format={format}
            onWordClick={handleWordClick}
          />
        </div>
      ))}
    </div>
  );
}
