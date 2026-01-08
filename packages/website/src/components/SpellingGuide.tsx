import type { OutputFormat } from '@ingglish/core';
import { arpabetPhonemeToIPA, arpabetPhonemeToIngglish } from '@ingglish/core';
import { useFormat } from '../contexts/FormatContext';

interface SoundEntry {
  phoneme: string;
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

function SpellingGuide(): React.JSX.Element {
  const { format } = useFormat();

  // Organize vowels by type (following traditional English phonics)
  const vowelGroups: SoundGroup[] = [
    {
      name: 'Short Vowels',
      sounds: [
        { phoneme: 'AE', examples: 'cat, bat' },
        { phoneme: 'EH', examples: 'bed, red' },
        { phoneme: 'IH', examples: 'bit, sit' },
        { phoneme: 'AH', examples: 'but, cup' },
        { phoneme: 'UH', examples: 'book, put' },
      ],
    },
    {
      name: 'Long Vowels',
      sounds: [
        { phoneme: 'EY', examples: 'say, cake' },
        { phoneme: 'IY', examples: 'bee, feet' },
        { phoneme: 'AY', examples: 'my, bike' },
        { phoneme: 'OW', examples: 'go, nose' },
        { phoneme: 'UW', examples: 'too, blue' },
      ],
    },
    {
      name: 'Other Vowels',
      sounds: [
        { phoneme: 'AA', examples: 'father, hot' },
        { phoneme: 'AO', examples: 'thought, law' },
        { phoneme: 'AW', examples: 'cow, out' },
        { phoneme: 'OY', examples: 'boy, toy' },
        { phoneme: 'ER', examples: 'bird, her' },
      ],
    },
  ];

  // Organize consonants by type
  const consonantGroups: SoundGroup[] = [
    {
      name: 'Stops (Plosives)',
      sounds: [
        { phoneme: 'P', examples: 'pat, cup' },
        { phoneme: 'B', examples: 'bat, cab' },
        { phoneme: 'T', examples: 'top, cat' },
        { phoneme: 'D', examples: 'dog, bed' },
        { phoneme: 'K', examples: 'cat, back' },
        { phoneme: 'G', examples: 'go, big' },
      ],
    },
    {
      name: 'Fricatives',
      sounds: [
        { phoneme: 'F', examples: 'fat, laugh' },
        { phoneme: 'V', examples: 'van, love' },
        { phoneme: 'TH', examples: 'think, bath' },
        { phoneme: 'DH', examples: 'the, this' },
        { phoneme: 'S', examples: 'sat, miss' },
        { phoneme: 'Z', examples: 'zoo, is' },
        { phoneme: 'SH', examples: 'she, push' },
        { phoneme: 'ZH', examples: 'measure, beige' },
        { phoneme: 'HH', examples: 'hat, ahead' },
      ],
    },
    {
      name: 'Affricates',
      sounds: [
        { phoneme: 'CH', examples: 'chat, batch' },
        { phoneme: 'JH', examples: 'just, edge' },
      ],
    },
    {
      name: 'Nasals',
      sounds: [
        { phoneme: 'M', examples: 'man, come' },
        { phoneme: 'N', examples: 'no, pen' },
        { phoneme: 'NG', examples: 'sing, thing' },
      ],
    },
    {
      name: 'Liquids & Glides',
      sounds: [
        { phoneme: 'L', examples: 'let, well' },
        { phoneme: 'R', examples: 'run, car' },
        { phoneme: 'W', examples: 'wet, away' },
        { phoneme: 'Y', examples: 'yes, you' },
      ],
    },
  ];

  const renderGroup = (group: SoundGroup): React.JSX.Element => (
    <div key={group.name} className="sound-group">
      <h4>{group.name}</h4>
      <table className="mapping-table">
        <thead>
          <tr>
            <th>IPA</th>
            <th>{format === 'ipa' ? 'IPA' : 'Ingglish'}</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          {group.sounds.map((sound) => (
            <tr key={sound.phoneme}>
              <td className="ipa-cell">{getIPA(sound.phoneme)}</td>
              <td className="spelling-cell">{getSpelling(sound.phoneme, format)}</td>
              <td className="examples-cell">{sound.examples}</td>
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
