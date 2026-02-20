import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  lookupPronunciation,
  lookupPhonemeKey,
  sortByFrequency,
  getWordFrequency,
  hasCustomPronunciation,
  getCustomPronunciation,
  loadReverseDictionary,
} from '@ingglish/dictionary';
import { arpabetToFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw, arpabetPhonemeToIPA } from '@ingglish/ipa';
import { translateWord } from 'ingglish';
import { wordToArpabetTraced } from '@ingglish/g2p';
import type { G2PTrace } from '@ingglish/g2p';
import {
  diagnoseFallback,
  decomposeCompound,
  diagnoseStemming,
  diagnoseBritish,
  isInitialism,
  translateAsAcronym,
  LETTER_PHONEMES,
} from '@ingglish/fallback';
import type { FallbackStrategy, StemmingResult } from '@ingglish/fallback';
import type { OutputFormat } from '@ingglish/phonemes';
import { stripStress, isVowel } from '@ingglish/phonemes';
import { useFormat } from '../contexts/FormatContext';
import { getFormatLabel } from '@ingglish/phonemes';

interface WordResult {
  word: string;
  phonemes: string[] | null;
  ipa: string;
  ingglish: string;
  formatted: string;
  matched: boolean;
  isCustom: boolean;
  homophones: string[];
  frequency: number | undefined;
  g2pTrace?: G2PTrace;
  fallbackStrategy?: FallbackStrategy | null;
  compoundParts?: string[];
  stemmingResult?: StemmingResult;
  britishSpelling?: string;
}

function analyzeWord(word: string, format: OutputFormat): WordResult {
  const lower = word.toLowerCase().trim();
  const dictPhonemes = lookupPronunciation(lower);
  const isCustom = hasCustomPronunciation(lower);
  const formatted = translateWord(lower, format);
  const ingglish = translateWord(lower, 'ingglish');

  let ipa = '';
  let homophones: string[] = [];
  let g2pTrace: G2PTrace | undefined;

  // Initialisms pass through unchanged in Latin formats, but the Word Explorer
  // should show the spelled-out pronunciation. Check before the dictionary branch
  // since some initialisms (e.g. "url") are also in the CMU dictionary.
  if (isInitialism(lower)) {
    return {
      word: lower,
      phonemes: null,
      ipa: translateAsAcronym(lower, 'ipa').replace(/^\/|\/$/g, ''),
      ingglish: translateAsAcronym(lower, 'ingglish'),
      formatted: translateAsAcronym(lower, format),
      matched: false,
      isCustom,
      homophones: [],
      frequency: getWordFrequency(lower),
      fallbackStrategy: 'initialism',
    };
  }

  if (dictPhonemes !== null) {
    ipa = arpabetToIPARaw(dictPhonemes);
    // Find homophones via reverse dictionary
    const key = dictPhonemes.map(stripStress).join(' ');
    const reverseMatches = lookupPhonemeKey(key);
    if (reverseMatches !== undefined) {
      homophones = sortByFrequency(reverseMatches).filter((w) => w !== lower);
    }
  } else {
    // Word not in dictionary — diagnose which fallback strategy handles it
    ipa = translateWord(lower, 'ipa').replace(/^\/|\/$/g, '');
    const strategy = diagnoseFallback(lower);
    let compoundParts: string[] | undefined;
    let stemmingResult: StemmingResult | undefined;
    let britishSpelling: string | undefined;
    let customPhonemes: string[] | null = null;

    if (strategy === 'g2p') {
      g2pTrace = wordToArpabetTraced(lower);
    } else if (strategy === 'compound') {
      compoundParts = decomposeCompound(lower) ?? undefined;
    } else if (strategy === 'stemming') {
      stemmingResult = diagnoseStemming(lower) ?? undefined;
    } else if (strategy === 'british') {
      britishSpelling = diagnoseBritish(lower) ?? undefined;
    } else if (strategy === 'custom') {
      customPhonemes = getCustomPronunciation(lower) ?? null;
    }

    return {
      word: lower,
      phonemes: dictPhonemes ?? g2pTrace?.phonemes ?? customPhonemes,
      ipa,
      ingglish,
      formatted,
      matched: false,
      isCustom,
      homophones,
      frequency: getWordFrequency(lower),
      g2pTrace,
      fallbackStrategy: strategy,
      compoundParts,
      stemmingResult,
      britishSpelling,
    };
  }

  // Check if this dictionary word is a British variant (colour→color, centre→center)
  const britishSpelling = diagnoseBritish(lower) ?? undefined;

  return {
    word: lower,
    phonemes: dictPhonemes,
    ipa,
    ingglish,
    formatted,
    matched: dictPhonemes !== null,
    isCustom,
    homophones,
    frequency: getWordFrequency(lower),
    britishSpelling,
  };
}

function formatFrequency(freq: number | undefined): string {
  if (freq === undefined) {
    return 'rare';
  }
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`;
  }
  return String(freq);
}

function PhonemeChain({ phonemes, format }: { phonemes: string[]; format: OutputFormat }) {
  return (
    <div className="phoneme-chain">
      <table className="chain-table">
        <thead>
          <tr>
            <th>ARPAbet</th>
            <th>IPA</th>
            <th>{getFormatLabel(format)}</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {phonemes.map((p, i) => (
            <tr key={i} className={isVowel(p) ? 'vowel-row' : ''}>
              <td className="mono">{p}</td>
              <td className="mono">{arpabetPhonemeToIPA(p).replace(/\u2060/g, '')}</td>
              <td className="mono highlight">{arpabetToFormat([p], format)}</td>
              <td className="type-label">{isVowel(p) ? 'vowel' : 'consonant'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function G2PRuleTrace({ trace, format }: { trace: G2PTrace; format: OutputFormat }) {
  return (
    <div className="phoneme-chain">
      <table className="chain-table">
        <thead>
          <tr>
            <th>Letters</th>
            <th>Rule</th>
            <th>Phonemes</th>
            <th>{getFormatLabel(format)}</th>
          </tr>
        </thead>
        <tbody>
          {trace.steps.map((step, i) => (
            <tr key={i}>
              <td className="mono">{step.letters}</td>
              <td className="mono rule-code">{step.rule}</td>
              <td className="mono">{step.phonemes.join(' ')}</td>
              <td className="mono highlight">
                {step.phonemes.length > 0 ? arpabetToFormat(step.phonemes, format) : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompoundBreakdown({
  parts,
  format,
  onWordClick,
}: {
  parts: string[];
  format: OutputFormat;
  onWordClick: (word: string) => void;
}) {
  return (
    <div className="explorer-section">
      <h4>Compound Breakdown</h4>
      <div className="homophone-list">
        {parts.map((part, i) => (
          <button
            key={i}
            className="homophone-chip"
            onClick={() => {
              onWordClick(part);
            }}
          >
            <span className="chip-english">{part}</span>
            <span className="chip-arrow">&rarr;</span>
            <span className="chip-translated">{translateWord(part, format)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StemmingBreakdown({
  result,
  format,
  onWordClick,
}: {
  result: StemmingResult;
  format: OutputFormat;
  onWordClick: (word: string) => void;
}) {
  return (
    <div className="explorer-section">
      <h4>Stemming Breakdown</h4>
      <div className="homophone-list">
        {result.prefix !== undefined && (
          <span className="homophone-chip" style={{ cursor: 'default' }}>
            <span className="chip-english">{result.prefix}-</span>
            <span className="chip-arrow">prefix</span>
          </span>
        )}
        <button
          className="homophone-chip"
          onClick={() => {
            onWordClick(result.stem);
          }}
        >
          <span className="chip-english">{result.stem}</span>
          <span className="chip-arrow">&rarr;</span>
          <span className="chip-translated">{translateWord(result.stem, format)}</span>
        </button>
        {result.suffix !== undefined && (
          <span className="homophone-chip" style={{ cursor: 'default' }}>
            <span className="chip-english">-{result.suffix}</span>
            <span className="chip-arrow">suffix</span>
          </span>
        )}
      </div>
    </div>
  );
}

function InitialismBreakdown({ word, format }: { word: string; format: OutputFormat }) {
  const letters = word.toLowerCase().split('');

  return (
    <div className="explorer-section">
      <h4>Initialism Breakdown</h4>
      <p className="section-note">{letters.map((l) => l.toUpperCase()).join(' \u00B7 ')}</p>
      <div className="phoneme-chain">
        <table className="chain-table">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Phonemes</th>
              <th>{getFormatLabel(format)}</th>
            </tr>
          </thead>
          <tbody>
            {letters.map((letter, i) => {
              const phonemes = LETTER_PHONEMES[letter];
              return (
                <tr key={i}>
                  <td className="mono">{letter.toUpperCase()}</td>
                  <td className="mono">{phonemes ? phonemes.join(' ') : '\u2014'}</td>
                  <td className="mono highlight">
                    {phonemes ? arpabetToFormat(phonemes, format) : '\u2014'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BritishBreakdown({
  original,
  american,
  format,
  onWordClick,
}: {
  original: string;
  american: string;
  format: OutputFormat;
  onWordClick: (word: string) => void;
}) {
  return (
    <div className="explorer-section">
      <h4>British Spelling</h4>
      <p className="section-note">
        Normalized to American spelling: {original} &rarr; {american}
      </p>
      <div className="homophone-list">
        <button
          className="homophone-chip"
          onClick={() => {
            onWordClick(american);
          }}
        >
          <span className="chip-english">{american}</span>
          <span className="chip-arrow">&rarr;</span>
          <span className="chip-translated">{translateWord(american, format)}</span>
        </button>
      </div>
    </div>
  );
}

function HomophoneList({
  homophones,
  format,
  onWordClick,
}: {
  homophones: string[];
  format: OutputFormat;
  onWordClick: (word: string) => void;
}) {
  if (homophones.length === 0) {
    return null;
  }

  return (
    <div className="explorer-section">
      <h4>Homophones ({homophones.length})</h4>
      <p className="section-note">Other words with the same pronunciation:</p>
      <div className="homophone-list">
        {homophones.slice(0, 20).map((w) => (
          <button
            key={w}
            className="homophone-chip"
            onClick={() => {
              onWordClick(w);
            }}
          >
            <span className="chip-english">{w}</span>
            <span className="chip-arrow">&rarr;</span>
            <span className="chip-translated">{translateWord(w, format)}</span>
            <span className="chip-freq">{formatFrequency(getWordFrequency(w))}</span>
          </button>
        ))}
        {homophones.length > 20 && (
          <span className="more-count">+{homophones.length - 20} more</span>
        )}
      </div>
    </div>
  );
}

function fallbackLabel(strategy: FallbackStrategy | null | undefined): string {
  switch (strategy) {
    case 'custom':
      return 'custom override';
    case 'initialism':
      return 'initialism';
    case 'british':
      return 'British spelling';
    case 'compound':
      return 'compound word';
    case 'stemming':
      return 'stemmed';
    case 'phonemize':
      return 'neural G2P';
    case 'g2p':
      return 'G2P rules';
    case null:
    case undefined:
      return 'passthrough';
  }
}

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
            {result.matched && result.britishSpelling !== undefined && (
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
