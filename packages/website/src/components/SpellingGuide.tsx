import type { OutputFormat } from '@ingglish/core';
import { arpabetPhonemeToIPA, arpabetPhonemeToIngglish } from '@ingglish/core';
import { useFormat } from '../contexts/FormatContext';

interface SoundEntry {
  phoneme: string;
  /** Examples with **bold** markers around the relevant letters */
  examples: string;
}

interface SoundGroup {
  name: string;
  sounds: SoundEntry[];
}

/**
 * Get clean IPA symbol for a phoneme (without word joiners used for line-break prevention)
 */
function getIPA(phoneme: string): string {
  return arpabetPhonemeToIPA(phoneme).replace(/\u2060/g, '');
}

/**
 * Get spelling for a phoneme based on format
 */
function getSpelling(phoneme: string, format: OutputFormat): string {
  if (format === 'ipa') {
    return getIPA(phoneme);
  }
  return arpabetPhonemeToIngglish(phoneme);
}

/**
 * Renders example text with **bold** markers converted to <strong> elements
 */
function renderExamples(examples: string): React.ReactNode {
  const parts = examples.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function SpellingGuide(): React.JSX.Element {
  const { format } = useFormat();

  // Organize vowels by type (following traditional English phonics)
  const vowelGroups: SoundGroup[] = [
    {
      name: 'Short Vowels',
      sounds: [
        { phoneme: 'AE', examples: 'c**a**t, b**a**t' },
        { phoneme: 'EH', examples: 'b**e**d, r**e**d' },
        { phoneme: 'IH', examples: 'b**i**t, s**i**t' },
        { phoneme: 'AH', examples: 'b**u**t, c**u**p' },
        { phoneme: 'UH', examples: 'b**oo**k, p**u**t' },
      ],
    },
    {
      name: 'Long Vowels',
      sounds: [
        { phoneme: 'EY', examples: 's**ay**, c**a**ke' },
        { phoneme: 'IY', examples: 'b**ee**, f**ee**t' },
        { phoneme: 'AY', examples: 'm**y**, b**i**ke' },
        { phoneme: 'OW', examples: 'g**o**, n**o**se' },
        { phoneme: 'UW', examples: 't**oo**, bl**ue**' },
      ],
    },
    {
      name: 'Other Vowels',
      sounds: [
        { phoneme: 'AA', examples: 'f**a**ther, h**o**t' },
        { phoneme: 'AO', examples: 'th**ough**t, l**aw**' },
        { phoneme: 'AW', examples: 'c**ow**, **ou**t' },
        { phoneme: 'OY', examples: 'b**oy**, t**oy**' },
        { phoneme: 'ER', examples: 'b**ir**d, h**er**' },
      ],
    },
  ];

  // Organize consonants by type
  const consonantGroups: SoundGroup[] = [
    {
      name: 'Stops (Plosives)',
      sounds: [
        { phoneme: 'P', examples: '**p**at, cu**p**' },
        { phoneme: 'B', examples: '**b**at, ca**b**' },
        { phoneme: 'T', examples: '**t**op, ca**t**' },
        { phoneme: 'D', examples: '**d**og, be**d**' },
        { phoneme: 'K', examples: '**c**at, ba**ck**' },
        { phoneme: 'G', examples: '**g**o, bi**g**' },
      ],
    },
    {
      name: 'Fricatives',
      sounds: [
        { phoneme: 'F', examples: '**f**at, lau**gh**' },
        { phoneme: 'V', examples: '**v**an, lo**v**e' },
        { phoneme: 'TH', examples: '**th**ink, ba**th**' },
        { phoneme: 'DH', examples: '**th**e, **th**is' },
        { phoneme: 'S', examples: '**s**at, mi**ss**' },
        { phoneme: 'Z', examples: '**z**oo, i**s**' },
        { phoneme: 'SH', examples: '**sh**e, pu**sh**' },
        { phoneme: 'ZH', examples: 'mea**s**ure, bei**ge**' },
        { phoneme: 'HH', examples: '**h**at, a**h**ead' },
      ],
    },
    {
      name: 'Affricates',
      sounds: [
        { phoneme: 'CH', examples: '**ch**at, bat**ch**' },
        { phoneme: 'JH', examples: '**j**ust, e**dge**' },
      ],
    },
    {
      name: 'Nasals',
      sounds: [
        { phoneme: 'M', examples: '**m**an, co**m**e' },
        { phoneme: 'N', examples: '**n**o, pe**n**' },
        { phoneme: 'NG', examples: 'si**ng**, thi**ng**' },
      ],
    },
    {
      name: 'Liquids & Glides',
      sounds: [
        { phoneme: 'L', examples: '**l**et, we**ll**' },
        { phoneme: 'R', examples: '**r**un, ca**r**' },
        { phoneme: 'W', examples: '**w**et, a**w**ay' },
        { phoneme: 'Y', examples: '**y**es, **y**ou' },
      ],
    },
  ];

  const renderGroup = (group: SoundGroup): React.JSX.Element => (
    <div key={group.name} className="sound-group">
      <h4>{group.name}</h4>
      <table className="mapping-table">
        <thead>
          <tr>
            <th>{format === 'ipa' ? 'IPA' : 'Ingglish'}</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          {group.sounds.map((sound) => (
            <tr key={sound.phoneme}>
              <td className="spelling-cell">{getSpelling(sound.phoneme, format)}</td>
              <td className="examples-cell">{renderExamples(sound.examples)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="spelling-guide">
      <div className="guide-intro">
        <p>
          Many{' '}
          <a
            href="https://en.wikipedia.org/wiki/English-language_spelling_reform"
            target="_blank"
            rel="noopener noreferrer"
          >
            spelling reforms
          </a>{' '}
          have been proposed over the centuries—from{' '}
          <a
            href="https://en.wikipedia.org/wiki/Benjamin_Franklin%27s_phonetic_alphabet"
            target="_blank"
            rel="noopener noreferrer"
          >
            Benjamin Franklin's phonetic alphabet
          </a>{' '}
          (1768) to the{' '}
          <a
            href="https://en.wikipedia.org/wiki/Shavian_alphabet"
            target="_blank"
            rel="noopener noreferrer"
          >
            Shavian alphabet
          </a>{' '}
          (48 new characters) to{' '}
          <a
            href="https://en.wikipedia.org/wiki/Cut_Spelling"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cut Spelling
          </a>{' '}
          (removing silent letters).{' '}
          <a
            href="https://en.wikipedia.org/wiki/Noah_Webster#Spelling_reform"
            target="_blank"
            rel="noopener noreferrer"
          >
            Noah Webster
          </a>{' '}
          succeeded in simplifying American spelling (color, center, dialog), but most reforms fail
          because they're either too radical to read or too conservative to help.
        </p>
        <p>
          Ingglish takes a practical middle path: it uses the{' '}
          <strong>familiar Latin alphabet</strong> with a <strong>one-to-one mapping</strong>{' '}
          between sounds and spellings. Each letter or letter combination always makes the same
          sound. You can read any word aloud correctly without memorization, start reading
          immediately without learning a new alphabet, and type on any standard keyboard without
          diacritics or special characters.
        </p>
      </div>

      <div className="guide-section">
        <h3>Key Principles</h3>
        <ul className="principles-list">
          <li>
            <strong>No silent letters</strong> - every letter is pronounced
          </li>
          <li>
            <strong>Consistent spelling</strong> - same sound = same spelling, always
          </li>
          <li>
            <strong>Readable aloud</strong> - anyone can pronounce unfamiliar words correctly
          </li>
          <li>
            <strong>Based on CMU dictionary</strong> - pronunciations from linguistic research
          </li>
        </ul>
      </div>

      <div className="guide-section">
        <h3>Vowels</h3>
        <div className="sound-groups">{vowelGroups.map(renderGroup)}</div>
      </div>

      <div className="guide-section">
        <h3>Consonants</h3>
        <div className="sound-groups">{consonantGroups.map(renderGroup)}</div>
      </div>

      <div className="guide-section">
        <h3>Unused Letters</h3>
        <p>
          These English letters are not used in Ingglish because they are redundant - their sounds
          are already covered by other letters:
        </p>
        <table className="mapping-table">
          <thead>
            <tr>
              <th>Letter</th>
              <th>Replaced By</th>
              <th>Example</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="spelling-cell">c</td>
              <td className="examples-cell">k or s</td>
              <td className="examples-cell">cat → kat, city → siti</td>
            </tr>
            <tr>
              <td className="spelling-cell">q</td>
              <td className="examples-cell">k or kw</td>
              <td className="examples-cell">queen → kween</td>
            </tr>
            <tr>
              <td className="spelling-cell">x</td>
              <td className="examples-cell">ks or z</td>
              <td className="examples-cell">box → boks, xylophone → zailufown</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SpellingGuide;
