/**
 * Review foreign language translation quality with famous literature quotes.
 * Usage: npx tsx --conditions=source scripts/review-languages.ts
 */
import { ipaToArpabet } from '../packages/ipa/src/from-ipa';
import { IPA_LANGUAGE_OVERRIDES } from '../packages/ipa/src/ipa-maps';
import { arpabetToFormat } from '@ingglish/phonemes';
import fs from 'fs';

const opts = { disableRColoring: true };

interface LangTest {
  code: string;
  file: string;
  name: string;
  quotes: { source: string; text: string }[];
}

const languages: LangTest[] = [
  {
    code: 'ar',
    file: 'ar.json',
    name: 'Arabic',
    quotes: [
      { source: 'Khalil Gibran, The Prophet', text: 'أولادكم ليسوا لكم أولادكم أبناء الحياة' },
      { source: 'Common greeting', text: 'السلام عليكم ورحمة الله وبركاته' },
      { source: 'Proverb', text: 'العلم نور والجهل ظلام' },
    ],
  },
  {
    code: 'de',
    file: 'de.json',
    name: 'German',
    quotes: [
      {
        source: 'Kafka, Die Verwandlung',
        text: 'Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte',
      },
      { source: 'Goethe, Faust', text: 'Zwei Seelen wohnen ach in meiner Brust' },
      { source: 'Nietzsche', text: 'Was mich nicht umbringt macht mich stärker' },
      { source: 'Rilke', text: 'Wer jetzt kein Haus hat baut sich keines mehr' },
    ],
  },
  {
    code: 'es',
    file: 'es.json',
    name: 'Spanish',
    quotes: [
      {
        source: 'Cervantes, Don Quixote',
        text: 'En un lugar de la Mancha de cuyo nombre no quiero acordarme',
      },
      {
        source: 'García Márquez, Cien años',
        text: 'Muchos años después frente al pelotón de fusilamiento',
      },
      { source: 'Neruda', text: 'Puedo escribir los versos más tristes esta noche' },
    ],
  },
  {
    code: 'fi',
    file: 'fi.json',
    name: 'Finnish',
    quotes: [
      { source: 'Kalevala (opening)', text: 'Mieleni minun tekevi aivoni ajattelevi' },
      {
        source: 'Aleksis Kivi, Seitsemän veljestä',
        text: 'Jukolan talo seisoi erään mäen pohjoisella rinteellä',
      },
      { source: 'Proverb', text: 'Ei kukaan ole seppä syntyessään' },
    ],
  },
  {
    code: 'fr',
    file: 'fr.json',
    name: 'French',
    quotes: [
      {
        source: 'Saint-Exupéry, Le Petit Prince',
        text: "On ne voit bien qu'avec le cœur l'essentiel est invisible pour les yeux",
      },
      {
        source: "Camus, L'Étranger",
        text: "Aujourd'hui maman est morte ou peut-être hier je ne sais pas",
      },
      { source: 'Hugo, Les Misérables', text: 'Il est certain que cela se parlait dans la rue' },
      { source: 'Descartes', text: 'Je pense donc je suis' },
    ],
  },
  {
    code: 'ja',
    file: 'ja.json',
    name: 'Japanese',
    quotes: [
      { source: 'Bashō, haiku', text: '古池や蛙飛び込む水の音' },
      { source: 'Natsume Sōseki, Kokoro', text: '私はその人を常に先生と呼んでいた' },
      { source: 'Kawabata, Snow Country', text: '国境の長いトンネルを抜けると雪国であった' },
    ],
  },
  {
    code: 'ko',
    file: 'ko.json',
    name: 'Korean',
    quotes: [
      {
        source: 'Yun Dong-ju, Counting Stars',
        text: '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를',
      },
      { source: 'Proverb', text: '가는 말이 고와야 오는 말이 곱다' },
      { source: 'Kim Sowol, Azaleas', text: '나 보기가 역겨워 가실 때에는' },
    ],
  },
  {
    code: 'zh',
    file: 'zh.json',
    name: 'Mandarin',
    quotes: [
      { source: 'Li Bai, Quiet Night Thought', text: '床前明月光疑是地上霜' },
      { source: 'Confucius, Analects', text: '学而时习之不亦说乎' },
      { source: 'Proverb', text: '千里之行始于足下' },
    ],
  },
  {
    code: 'nl',
    file: 'nl.json',
    name: 'Dutch',
    quotes: [
      {
        source: 'Anne Frank, Het Achterhuis',
        text: 'Ik hoop dat ik je alles kan toevertrouwen zoals ik het nog aan niemand heb gekund',
      },
      {
        source: 'Multatuli, Max Havelaar',
        text: 'Ik ben makelaar in koffie en woon op de Lauriergracht',
      },
      { source: 'Proverb', text: 'Wie goed doet goed ontmoet' },
    ],
  },
  {
    code: 'pt',
    file: 'pt.json',
    name: 'Portuguese',
    quotes: [
      {
        source: 'Pessoa, Tabacaria',
        text: 'Não sou nada nunca serei nada não posso querer ser nada',
      },
      { source: 'Camões, Os Lusíadas', text: 'As armas e os barões assinalados' },
      { source: 'Saramago', text: 'A viagem não acaba nunca' },
    ],
  },
];

const NOT_FOUND = '\uFFFD';

/** Convert a dict entry (IPA string or ARPAbet array) to Ingglish. */
function toIngglish(entry: string | string[], overrides?: Record<string, string>): string {
  if (Array.isArray(entry)) {
    return arpabetToFormat(entry, 'ingglish', opts);
  }
  const clean = entry.replace(/^\/|\/$/g, '').replaceAll('.', '');
  const arp = ipaToArpabet(clean, overrides);
  return arpabetToFormat(arp, 'ingglish', opts);
}

function translateQuote(
  text: string,
  dict: Record<string, string | string[]>,
  overrides?: Record<string, string>
): string {
  return text
    .split(/(\s+)/)
    .map((segment) => {
      if (/^\s+$/.test(segment) || !segment) return segment;

      // Strip punctuation
      const leading: string[] = [];
      const trailing: string[] = [];
      let core = segment;
      while (core.length > 0 && /^\P{L}/u.test(core)) {
        leading.push(core[0]!);
        core = core.slice(1);
      }
      while (core.length > 0 && /\P{L}$/u.test(core)) {
        trailing.unshift(core.at(-1)!);
        core = core.slice(0, -1);
      }
      if (!core) return segment;

      const entry = dict[core] ?? dict[core.toLowerCase()];
      if (entry != null) {
        return leading.join('') + toIngglish(entry, overrides) + trailing.join('');
      }

      // Try splitting on apostrophes/hyphens
      const parts = core.split(/(?<=['-])|(?=['-])/);
      if (parts.length > 1) {
        let anyFound = false;
        const translated = parts.map((part) => {
          if (part === "'" || part === '-') return part;
          const partEntry = dict[part] ?? dict[part.toLowerCase()];
          if (partEntry != null) {
            anyFound = true;
            return toIngglish(partEntry, overrides);
          }
          return NOT_FOUND + part;
        });
        if (anyFound) {
          return (
            leading.join('') + translated.join('').replaceAll(NOT_FOUND, '?') + trailing.join('')
          );
        }
      }

      return '?' + core;
    })
    .join('');
}

// Main
export function main() {
  for (const lang of languages) {
    const dictPath = `${process.cwd()}/packages/website/public/ipa-dicts/${lang.file}`;
    let dict: Record<string, string | string[]>;
    try {
      dict = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
    } catch {
      console.log(`\n=== ${lang.name} — dict not found ===`);
      continue;
    }

    const overrides = IPA_LANGUAGE_OVERRIDES[lang.code];
    const dictSize = Object.keys(dict).length;
    console.log(
      `\n=== ${lang.name} (${lang.code}, ${dictSize.toLocaleString()} entries${overrides ? ', has overrides' : ''}) ===`
    );

    for (const quote of lang.quotes) {
      const result = translateQuote(quote.text, dict, overrides);
      // Count found vs not-found words
      const words = quote.text.split(/\s+/).filter((w) => w.length > 0);
      const missing = (result.match(/\?/g) ?? []).length;
      const coverage = Math.round(((words.length - missing) / words.length) * 100);

      console.log(`\n  ${quote.source}:`);
      console.log(`  ${quote.text}`);
      console.log(`  → ${result}`);
      console.log(`  (${coverage}% coverage, ${missing}/${words.length} words missing)`);
    }
  }
}

if (process.argv[1]?.includes('review-languages')) main();
