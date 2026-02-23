import { ipaToArpabet } from '@ingglish/ipa';
import { arpabetToFormat, arpabetToIngglish } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
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

/**
 * Converts an IPA transcription to the specified output format.
 */
function ipaToFormat(ipa: string, format: OutputFormat): string {
  const clean = ipa.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
  const arpabet = ipaToArpabet(clean);
  return arpabetToFormat(arpabet, format);
}

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/**
 * Translates foreign text to the specified output format.
 * Words not found in the dictionary are returned with a marker prefix.
 */
export function translateForeign(
  text: string,
  dict: IpaDict,
  format: OutputFormat = 'ingglish'
): string {
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

      // Peel off leading non-letter characters (Unicode-aware so Arabic/CJK aren't stripped)
      while (core.length > 0 && /^\P{L}/u.test(core)) {
        leading.push(core[0]!);
        core = core.slice(1);
      }
      // Peel off trailing non-letter characters
      while (core.length > 0 && /\P{L}$/u.test(core)) {
        trailing.unshift(core.at(-1)!);
        core = core.slice(0, -1);
      }

      if (!core) {
        return segment;
      }

      const ipa = lookupIpa(dict, core);
      if (ipa) {
        return leading.join('') + ipaToFormat(ipa, format) + trailing.join('');
      }
      // Not found — return original with marker
      return NOT_FOUND_MARKER + segment;
    })
    .join('');
}
