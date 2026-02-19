import { translateSyncWithMapping, type TranslatedToken } from 'ingglish';

export function buildDiffMap(
  tokens: TranslatedToken[],
  text: string,
  format: string
): Map<number, string> | undefined {
  if (format === 'ingglish') {
    return undefined;
  }
  try {
    const stdTokens = translateSyncWithMapping(text, 'ingglish');
    const diffs = new Map<number, string>();
    let wordIdx = 0;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i]?.isWord === true) {
        const stdTok = stdTokens[i];
        if (
          stdTok?.isWord === true &&
          tokens[i].translated.toLowerCase() !== stdTok.translated.toLowerCase()
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
