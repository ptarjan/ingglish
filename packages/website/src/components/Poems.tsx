import { useState, useMemo } from 'react';
import { translateSync } from 'ingglish';
import type { OutputFormat } from 'ingglish';
import { useFormat } from '../contexts/FormatContext';
import { poems } from './poems-data';

interface TranslatedWord {
  english: string;
  translated: string;
  changed: boolean;
}

function translateLine(line: string, format: OutputFormat): TranslatedWord[] {
  // Translate the full line so sentence-start capitalization applies
  const fullTranslation = translateSync(line, format);
  const englishTokens = line.split(/(\s+)/);
  const translatedTokens = fullTranslation.split(/(\s+)/);

  return englishTokens.map((token, i) => {
    if (/^\s+$/.test(token)) {
      return { english: token, translated: token, changed: false };
    }
    const translated = translatedTokens[i] ?? token;
    return {
      english: token,
      translated,
      changed: token.toLowerCase() !== translated.toLowerCase(),
    };
  });
}

const FORMAT_LABELS: Record<string, string> = {
  ingglish: 'Ingglish',
  ipa: 'IPA',
  shavian: 'Shavian',
  deseret: 'Deseret',
};

function PoemCard({
  title,
  author,
  year,
  lines,
  format,
}: {
  title: string;
  author: string;
  year: string;
  lines: string[];
  format: OutputFormat;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  const translatedLines = useMemo(
    () => (expanded ? lines.map((line) => translateLine(line, format)) : []),
    [expanded, lines, format]
  );

  return (
    <div className={`poem-card${expanded ? ' expanded' : ''}`}>
      <div
        className="poem-header"
        onClick={() => {
          setExpanded((v) => !v);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <div className="poem-title-area">
          <h3 className="poem-title">{title}</h3>
          <div className="poem-meta">
            {author} &middot; {year}
          </div>
        </div>
        <span className="poem-chevron">&#x25B6;</span>
      </div>
      {expanded && (
        <div className="poem-body">
          <div className="poem-toggle">
            <button
              className={`poem-toggle-btn${!showTranslated ? ' active' : ''}`}
              onClick={() => {
                setShowTranslated(false);
              }}
            >
              English
            </button>
            <button
              className={`poem-toggle-btn${showTranslated ? ' active' : ''}`}
              onClick={() => {
                setShowTranslated(true);
              }}
            >
              {FORMAT_LABELS[format] ?? format}
            </button>
          </div>
          <div className="poem-lines">
            {translatedLines.map((words, li) => {
              // Empty line = stanza break
              if (words.length === 1 && words[0].english === '') {
                return <div key={li} className="poem-stanza-break" />;
              }
              return (
                <div key={li} className="poem-line">
                  {words.map((w, wi) => {
                    if (!showTranslated) {
                      return <span key={wi}>{w.english}</span>;
                    }
                    if (!w.changed) {
                      return <span key={wi}>{w.translated}</span>;
                    }
                    return (
                      <span key={wi} className="poem-word-changed" data-orig={w.english}>
                        {w.translated}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {showTranslated && <p className="poem-hint">Hover any blue word to see the original.</p>}
        </div>
      )}
    </div>
  );
}

export default function Poems() {
  const { format, toggleFormat } = useFormat();
  const formatLabel = FORMAT_LABELS[format] ?? format;

  return (
    <div className="poems-page">
      <h2>Poems About English Spelling</h2>
      <p className="poems-page-subtitle">
        Famous poems that highlight the absurdities of English spelling and pronunciation. Toggle
        each poem to see its{' '}
        <button className="format-cycle-btn format-cycle-inline" onClick={toggleFormat}>
          {formatLabel} <span aria-hidden="true">&#x21C5;</span>
        </button>{' '}
        translation.
      </p>
      {poems.map((poem) => (
        <PoemCard
          key={poem.title}
          title={poem.title}
          author={poem.author}
          year={poem.year}
          lines={poem.lines}
          format={format}
        />
      ))}
    </div>
  );
}
