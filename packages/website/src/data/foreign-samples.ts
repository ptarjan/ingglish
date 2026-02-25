import { ar } from './samples/ar';
import { de } from './samples/de';
import { es } from './samples/es';
import { fi } from './samples/fi';
import { fr } from './samples/fr';
import { ja } from './samples/ja';
import { ko } from './samples/ko';
import { nl } from './samples/nl';
import { pt } from './samples/pt';
import type { ForeignSample } from './samples/types';
import { zh } from './samples/zh';

/**
 * Famous literature, speeches, and poetry for each supported language.
 * Used as example text on the /text page when a foreign language is selected.
 *
 * Each sample should be substantial (2-4 sentences or a full stanza).
 *
 * For CJK and agglutinative languages (ja, zh, ko, fi), text uses
 * space-separated base forms since the translator splits on whitespace
 * and the dictionaries only contain base/lemma forms.
 *
 * Per-language samples are in ./samples/<lang>.ts for easier editing.
 */
export const FOREIGN_SAMPLES: Record<string, ForeignSample[]> = {
  ar,
  de,
  es,
  fi,
  fr,
  ja,
  ko,
  nl,
  pt,
  zh,
};

export function pickForeignSample(langCode: string, currentText: string): string | undefined {
  const samples = FOREIGN_SAMPLES[langCode];
  if (!samples || samples.length === 0) {
    return undefined;
  }
  let pick = samples[0]!;
  if (samples.length > 1) {
    do {
      pick = samples[Math.floor(Math.random() * samples.length)]!;
    } while (pick.text === currentText);
  }
  return pick.text;
}
