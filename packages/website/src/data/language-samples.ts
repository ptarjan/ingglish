import { ar } from './samples/ar';
import { de } from './samples/de';
import { en } from './samples/en';
import { eo } from './samples/eo';
import { es } from './samples/es';
import { fa } from './samples/fa';
import { fi } from './samples/fi';
import { fr } from './samples/fr';
import { is } from './samples/is';
import { ja } from './samples/ja';
import { jam } from './samples/jam';
import { km } from './samples/km';
import { ko } from './samples/ko';
import { ma } from './samples/ma';
import { nb } from './samples/nb';
import { nl } from './samples/nl';
import { or as orSamples } from './samples/or';
import { pt } from './samples/pt';
import { ro } from './samples/ro';
import { sv } from './samples/sv';
import { sw } from './samples/sw';
import type { Sample } from './samples/types';
import { vi } from './samples/vi';
import { yue } from './samples/yue';
import { zh } from './samples/zh';

/**
 * Famous literature, speeches, and poetry for each supported language.
 * Used as example text on the /text page and experiment page.
 *
 * Each sample should be substantial (2-4 sentences or a full stanza).
 *
 * For CJK and agglutinative languages (ja, zh, ko, fi), text uses
 * space-separated base forms since the translator splits on whitespace
 * and the dictionaries only contain base/lemma forms.
 *
 * Per-language samples are in ./samples/<lang>.ts for easier editing.
 */
export const ALL_SAMPLES: Record<string, Sample[]> = {
  ar,
  de,
  en,
  eo,
  es,
  fa,
  fi,
  fr,
  is,
  ja,
  jam,
  km,
  ko,
  ma,
  nb,
  nl,
  or: orSamples,
  pt,
  ro,
  sv,
  sw,
  vi,
  yue,
  zh,
};

export function pickSample(langCode: string, currentText: string): string | undefined {
  const samples = ALL_SAMPLES[langCode];
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
