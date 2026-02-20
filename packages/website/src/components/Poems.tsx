import { useState, useMemo } from 'react';
import { translateSyncWithMapping, type TranslatedToken } from 'ingglish';
import type { OutputFormat } from '@ingglish/phonemes';
import { getFormatLabel } from '@ingglish/phonemes';
import { useFormat } from '../contexts/FormatContext';
import { poems } from '../data/poems-data';
import { MappedWordDisplay } from './MappedWordDisplay';
import { buildDiffMap } from '../utils/diff-map';

interface TranslatedLine {
  tokens: TranslatedToken[];
  diffMap: Map<number, string> | undefined;
}

function translateLine(line: string, format: OutputFormat): TranslatedLine {
  if (line === '') {
    return { tokens: [], diffMap: undefined };
  }
  const tokens = translateSyncWithMapping(line, format);
  const diffMap = buildDiffMap(tokens, line, format);
  return { tokens, diffMap };
}

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
              {getFormatLabel(format)}
            </button>
          </div>
          <div className="poem-lines">
            {lines.map((line, li) => {
              if (line === '') {
                return <div key={li} className="poem-stanza-break" />;
              }
              if (!showTranslated) {
                return (
                  <div key={li} className="poem-line">
                    {line}
                  </div>
                );
              }
              const translated = translatedLines[li];
              if (translated === undefined) {
                return null;
              }
              const { tokens, diffMap } = translated;
              return (
                <div key={li} className="poem-line">
                  <MappedWordDisplay
                    tokens={tokens}
                    diffMap={diffMap}
                    showTooltip
                    className="poem-words"
                  />
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
  const formatLabel = getFormatLabel(format);

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
