import { type TranslatedToken, translateSyncWithMapping } from 'ingglish';

export function buildDiffMap(
  tokens: TranslatedToken[],
  text: string,
  format: string
): Map<number, string> | undefined {
  if (format === 'ingglish') {
    return undefined;
  }
  try {
    const stdTokens = translateSyncWithMapping(text, { format: 'ingglish' });
    const diffs = new Map<number, string>();
    let wordIdx = 0;
    for (const [i, tok] of tokens.entries()) {
      if (tok?.isWord) {
        const stdTok = stdTokens[i];
        if (
          stdTok?.isWord === true &&
          tok.translated.toLowerCase() !== stdTok.translated.toLowerCase()
        ) {
          diffs.set(wordIdx, stdTok.translated);
        }
        wordIdx++;
      }
    }
    return diffs.size > 0 ? diffs : undefined;
  } catch {
    return undefined;
  }
}
