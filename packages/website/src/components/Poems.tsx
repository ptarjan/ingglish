import { useState, useMemo } from 'react';
import { translateSync } from '@ingglish/core';
import { poems } from './poems-data';

interface TranslatedWord {
  english: string;
  ingglish: string;
  changed: boolean;
}

function translateLine(line: string): TranslatedWord[] {
  return line.split(/(\s+)/).map((token) => {
    if (/^\s+$/.test(token)) {
      return { english: token, ingglish: token, changed: false };
    }
    const translated = translateSync(token, 'ingglish');
    return {
      english: token,
      ingglish: translated,
      changed: token.toLowerCase() !== translated.toLowerCase(),
    };
  });
}

function PoemCard({
  title,
  author,
  year,
  lines,
}: {
  title: string;
  author: string;
  year: string;
  lines: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [showIngglish, setShowIngglish] = useState(false);

  const translatedLines = useMemo(
    () => (expanded ? lines.map((line) => translateLine(line)) : []),
    [expanded, lines]
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
              className={`poem-toggle-btn${!showIngglish ? ' active' : ''}`}
              onClick={() => {
                setShowIngglish(false);
              }}
            >
              English
            </button>
            <button
              className={`poem-toggle-btn${showIngglish ? ' active' : ''}`}
              onClick={() => {
                setShowIngglish(true);
              }}
            >
              Ingglish
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
                    if (!showIngglish) {
                      return <span key={wi}>{w.english}</span>;
                    }
                    if (!w.changed) {
                      return <span key={wi}>{w.ingglish}</span>;
                    }
                    return (
                      <span key={wi} className="poem-word-changed" data-orig={w.english}>
                        {w.ingglish}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {showIngglish && <p className="poem-hint">Hover any blue word to see the original.</p>}
        </div>
      )}
    </div>
  );
}

export default function Poems() {
  return (
    <div className="poems-page">
      <h2>Poems About English Spelling</h2>
      <p className="poems-page-subtitle">
        Famous poems that highlight the absurdities of English spelling and pronunciation. Toggle
        each poem to see its Ingglish translation.
      </p>
      {poems.map((poem) => (
        <PoemCard
          key={poem.title}
          title={poem.title}
          author={poem.author}
          year={poem.year}
          lines={poem.lines}
        />
      ))}
    </div>
  );
}
