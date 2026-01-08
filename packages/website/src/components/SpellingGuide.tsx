import { arpabetPhonemeToIPA, arpabetPhonemeToIngglish } from '@ingglish/core';

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
  // Organize vowels by type (following traditional English phonics)
  const vowelGroups: SoundGroup[] = [
    {
      name: 'Short Vowels',
      sounds: [
        { phoneme: 'AE', examples: '**a**pple, c**a**t, b**a**d' },
        { phoneme: 'EH', examples: '**e**gg, p**e**t, b**e**d' },
        { phoneme: 'IH', examples: 'b**i**t, s**i**t, p**i**g' },
        { phoneme: 'AH', examples: 'b**u**t, c**u**p, c**u**t' },
        { phoneme: 'UH', examples: 'b**oo**k, p**u**t, g**oo**d' },
      ],
    },
    {
      name: 'Long Vowels',
      sounds: [
        { phoneme: 'EY', examples: 'c**a**ke, n**a**me, st**ay**' },
        { phoneme: 'IY', examples: 'tr**ee**, f**ee**t, m**e**' },
        { phoneme: 'AY', examples: 'b**i**ke, k**i**te, t**i**me' },
        { phoneme: 'OW', examples: 'g**o**, n**o**se, c**o**ld' },
        { phoneme: 'UW', examples: 't**oo**, bl**ue**, m**oo**n' },
      ],
    },
    {
      name: 'Diphthongs & Other',
      sounds: [
        { phoneme: 'AW', examples: 'n**ow**, h**ow**, **ou**t' },
        { phoneme: 'OY', examples: 'b**oy**, t**oy**, n**oi**se' },
        { phoneme: 'AA', examples: 'f**a**ther, h**o**t, c**a**lm' },
        { phoneme: 'AO', examples: 'th**ough**t, l**aw**, c**augh**t' },
        { phoneme: 'ER', examples: 'b**ir**d, h**er**, t**ur**n' },
        { phoneme: 'AH0', examples: '**a**bout, sof**a**, banan**a**' },
      ],
    },
  ];

  // Organize consonants by type
  const consonantGroups: SoundGroup[] = [
    {
      name: 'Stops',
      sounds: [
        { phoneme: 'P', examples: '**p**at, ha**pp**y, cu**p**' },
        { phoneme: 'B', examples: '**b**at, a**b**out, ca**b**' },
        { phoneme: 'T', examples: '**t**op, be**tt**er, ca**t**' },
        { phoneme: 'D', examples: '**d**og, la**dd**er, be**d**' },
        { phoneme: 'K', examples: '**c**at, ba**ck**er, ba**ck**' },
        { phoneme: 'G', examples: '**g**o, bi**gg**er, bi**g**' },
      ],
    },
    {
      name: 'Fricatives',
      sounds: [
        { phoneme: 'F', examples: '**f**at, a**f**ter, lau**gh**' },
        { phoneme: 'V', examples: '**v**an, o**v**er, lo**v**e' },
        { phoneme: 'TH', examples: '**th**ink, no**th**ing, ba**th**' },
        { phoneme: 'DH', examples: '**th**e, fa**th**er, smoo**th**' },
        { phoneme: 'S', examples: '**s**at, mi**ss**ing, mi**ss**' },
        { phoneme: 'Z', examples: '**z**oo, bu**zz**ing, i**s**' },
        { phoneme: 'SH', examples: '**sh**e, wa**sh**ing, pu**sh**' },
        { phoneme: 'ZH', examples: 'mea**s**ure, vi**s**ion, bei**ge**' },
        { phoneme: 'HH', examples: '**h**at, a**h**ead, be**h**ind' },
      ],
    },
    {
      name: 'Affricates',
      sounds: [
        { phoneme: 'CH', examples: '**ch**at, tea**ch**er, bat**ch**' },
        { phoneme: 'JH', examples: '**j**ust, a**g**ent, e**dge**' },
      ],
    },
    {
      name: 'Nasals',
      sounds: [
        { phoneme: 'M', examples: '**m**an, ha**mm**er, co**m**e' },
        { phoneme: 'N', examples: '**n**o, ru**nn**ing, pe**n**' },
        { phoneme: 'NG', examples: 'si**ng**er, thi**nk**ing, si**ng**' },
      ],
    },
    {
      name: 'Liquids & Glides',
      sounds: [
        { phoneme: 'L', examples: '**l**et, be**ll**ow, we**ll**' },
        { phoneme: 'R', examples: '**r**un, ca**rr**y, ca**r**' },
        { phoneme: 'W', examples: '**w**et, a**w**ay, al**w**ays' },
        { phoneme: 'Y', examples: '**y**es, be**y**ond, can**y**on' },
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
            <th>Ingglish</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          {group.sounds.map((sound) => (
            <tr key={sound.phoneme}>
              <td className="ipa-cell">{getIPA(sound.phoneme)}</td>
              <td className="ingglish-cell">{arpabetPhonemeToIngglish(sound.phoneme)}</td>
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
              <td className="ingglish-cell">c</td>
              <td className="examples-cell">k or s</td>
              <td className="examples-cell">cat → kat, city → siti</td>
            </tr>
            <tr>
              <td className="ingglish-cell">q</td>
              <td className="examples-cell">k or kw</td>
              <td className="examples-cell">queen → kween</td>
            </tr>
            <tr>
              <td className="ingglish-cell">x</td>
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
