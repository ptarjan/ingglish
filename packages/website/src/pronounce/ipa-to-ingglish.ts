import { ipaToArpabet } from '@ingglish/ipa';
import { arpabetToIngglish } from '@ingglish/phonemes';
import type { IpaDict } from './dict-loader';
import { lookupIpa } from './dict-loader';

/**
 * Converts an IPA transcription to Ingglish spelling.
 * Strips slashes and syllable dots before conversion.
 */
export function ipaToIngglish(ipa: string): string {
  // Remove surrounding slashes and syllable separators
  const clean = ipa.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
  const arpabet = ipaToArpabet(clean);
  return arpabetToIngglish(arpabet);
}

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/**
 * Translates foreign text to Ingglish pronunciation.
 * Words not found in the dictionary are returned with a marker prefix.
 */
export function translateForeign(text: string, dict: IpaDict): string {
  return text
    .split(/(\s+)/)
    .map((segment) => {
      // Preserve whitespace segments as-is
      if (/^\s+$/.test(segment)) {
        return segment;
      }
      if (!segment) {
        return segment;
      }

      // Strip leading/trailing punctuation for lookup
      const leading: string[] = [];
      const trailing: string[] = [];
      let core = segment;

      // Peel off leading non-word characters
      while (core.length > 0 && /^\W/.test(core)) {
        leading.push(core[0]!);
        core = core.slice(1);
      }
      // Peel off trailing non-word characters
      while (core.length > 0 && /\W$/.test(core)) {
        trailing.unshift(core.at(-1)!);
        core = core.slice(0, -1);
      }

      if (!core) {
        return segment;
      }

      const ipa = lookupIpa(dict, core);
      if (ipa) {
        return leading.join('') + ipaToIngglish(ipa) + trailing.join('');
      }
      // Not found — return original with marker
      return NOT_FOUND_MARKER + segment;
    })
    .join('');
}
