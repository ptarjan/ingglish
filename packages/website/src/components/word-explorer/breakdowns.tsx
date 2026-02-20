import { arpabetToFormat, isVowel } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetPhonemeToIPA } from '@ingglish/ipa';
import { translateWord } from 'ingglish';
import { getWordFrequency } from '@ingglish/dictionary';
import { getFormatLabel } from '@ingglish/phonemes';
import { LETTER_PHONEMES } from '@ingglish/fallback';
import type { G2PTrace } from '@ingglish/g2p';
import type { StemmingResult } from '@ingglish/fallback';
import { formatFrequency } from './analyze';

export function PhonemeChain({ phonemes, format }: { phonemes: string[]; format: OutputFormat }) {
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

export function G2PRuleTrace({ trace, format }: { trace: G2PTrace; format: OutputFormat }) {
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

export function CompoundBreakdown({
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

export function StemmingBreakdown({
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

export function InitialismBreakdown({ word, format }: { word: string; format: OutputFormat }) {
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

export function BritishBreakdown({
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

export function HomophoneList({
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
