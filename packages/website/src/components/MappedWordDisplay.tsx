import type { TranslatedToken } from 'ingglish';

interface MappedWordDisplayProps {
  tokens: TranslatedToken[];
  hoveredWordIndex?: number | null;
  spokenWordIndex?: number | null;
  onHoverWord?: (index: number | null) => void;
  className?: string;
  placeholder?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
  onScroll?: () => void;
  showTooltip?: boolean;
  /** Map of word index → standard Ingglish spelling for words that differ from experiment */
  diffMap?: Map<number, string>;
}

export function MappedWordDisplay({
  tokens,
  hoveredWordIndex = null,
  spokenWordIndex = null,
  onHoverWord,
  className,
  placeholder = 'Hover to see word correspondence...',
  scrollRef,
  onScroll,
  showTooltip = true,
  diffMap,
}: MappedWordDisplayProps) {
  let wordIndex = 0;
  return (
    <div ref={scrollRef} onScroll={onScroll} className={`word-display ${className ?? ''}`}>
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
          if (showTooltip && changed) {
            tooltip = isDiff ? `${token.original} (Ingglish: ${stdSpelling})` : token.original;
          }

          return (
            <span
              key={i}
              className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''} ${!matched ? 'unmatched' : ''} ${isDiff ? 'format-diff' : ''}`}
              data-orig={tooltip}
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
