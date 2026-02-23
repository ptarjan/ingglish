import type { TranslatedToken } from 'ingglish';

interface MappedWordDisplayProps {
  className?: string;
  /** Map of word index → standard Ingglish spelling for words that differ from experiment */
  diffMap?: Map<number, string>;
  hoveredWordIndex?: null | number;
  onHoverWord?: (index: null | number) => void;
  onScroll?: () => void;
  placeholder?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
  showTooltip?: boolean;
  spokenWordIndex?: null | number;
  tokens: TranslatedToken[];
}

export function MappedWordDisplay({
  className,
  diffMap,
  hoveredWordIndex = null,
  onHoverWord,
  onScroll,
  placeholder = 'Hover to see word correspondence...',
  scrollRef,
  showTooltip = true,
  spokenWordIndex = null,
  tokens,
}: MappedWordDisplayProps) {
  let wordIndex = 0;
  return (
    <div className={`word-display ${className ?? ''}`} onScroll={onScroll} ref={scrollRef}>
      {tokens.map((token, i) => {
        if (token.isWord) {
          const currentWordIndex = wordIndex++;
          const isHighlighted = currentWordIndex === hoveredWordIndex;
          const isSpoken = currentWordIndex === spokenWordIndex;
          const matched = 'matched' in token ? (token.matched ?? true) : true;
          const changed = token.original.toLowerCase() !== token.translated.toLowerCase();
          const stdSpelling = diffMap?.get(currentWordIndex);
          const isDiff = stdSpelling !== undefined;

          let tooltip: string | undefined;
          if (showTooltip && (changed || isDiff)) {
            tooltip = isDiff ? `${token.original} (Ingglish: ${stdSpelling})` : token.original;
          }

          return (
            <span
              className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''} ${matched ? '' : 'unmatched'} ${isDiff ? 'format-diff' : ''}`}
              data-orig={tooltip}
              key={i}
              onMouseEnter={
                onHoverWord
                  ? () => {
                      onHoverWord(currentWordIndex);
                    }
                  : undefined
              }
              onMouseLeave={
                onHoverWord
                  ? () => {
                      onHoverWord(null);
                    }
                  : undefined
              }
            >
              {token.translated}
            </span>
          );
        }
        return <span key={i}>{token.translated}</span>;
      })}
      {tokens.length === 0 && <span className="placeholder">{placeholder}</span>}
    </div>
  );
}
