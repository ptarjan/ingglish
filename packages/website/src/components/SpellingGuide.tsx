import { VOWEL_MAP, CONSONANT_MAP } from '@ingglish/core';

interface SoundEntry {
  phoneme: string;
  spelling: string;
  examples: string;
}

interface SoundGroup {
  name: string;
  sounds: SoundEntry[];
}

function SpellingGuide() {
  // Organize vowels by type (following traditional English phonics)
  const vowelGroups: SoundGroup[] = [
    {
      name: 'Short Vowels',
      sounds: [
        { phoneme: 'AE', spelling: VOWEL_MAP.AE, examples: 'cat, bat' },
        { phoneme: 'EH', spelling: VOWEL_MAP.EH, examples: 'bed, red' },
        { phoneme: 'IH', spelling: VOWEL_MAP.IH, examples: 'bit, sit' },
        { phoneme: 'AH', spelling: VOWEL_MAP.AH, examples: 'but, cup' },
        { phoneme: 'UH', spelling: VOWEL_MAP.UH, examples: 'book, put' },
      ],
    },
    {
      name: 'Long Vowels',
      sounds: [
        { phoneme: 'EY', spelling: VOWEL_MAP.EY, examples: 'say, cake' },
        { phoneme: 'IY', spelling: VOWEL_MAP.IY, examples: 'bee, feet' },
        { phoneme: 'AY', spelling: VOWEL_MAP.AY, examples: 'my, bike' },
        { phoneme: 'OW', spelling: VOWEL_MAP.OW, examples: 'go, nose' },
        { phoneme: 'UW', spelling: VOWEL_MAP.UW, examples: 'too, blue' },
      ],
    },
    {
      name: 'Other Vowels',
      sounds: [
        { phoneme: 'AA', spelling: VOWEL_MAP.AA, examples: 'father, hot' },
        { phoneme: 'AO', spelling: VOWEL_MAP.AO, examples: 'thought, law' },
        { phoneme: 'AW', spelling: VOWEL_MAP.AW, examples: 'cow, out' },
        { phoneme: 'OY', spelling: VOWEL_MAP.OY, examples: 'boy, toy' },
        { phoneme: 'ER', spelling: VOWEL_MAP.ER, examples: 'bird, her' },
      ],
    },
  ];

  // Organize consonants by type
  const consonantGroups: SoundGroup[] = [
    {
      name: 'Stops (Plosives)',
      sounds: [
        { phoneme: 'P', spelling: CONSONANT_MAP.P, examples: 'pat, cup' },
        { phoneme: 'B', spelling: CONSONANT_MAP.B, examples: 'bat, cab' },
        { phoneme: 'T', spelling: CONSONANT_MAP.T, examples: 'top, cat' },
        { phoneme: 'D', spelling: CONSONANT_MAP.D, examples: 'dog, bed' },
        { phoneme: 'K', spelling: CONSONANT_MAP.K, examples: 'cat, back' },
        { phoneme: 'G', spelling: CONSONANT_MAP.G, examples: 'go, big' },
      ],
    },
    {
      name: 'Fricatives',
      sounds: [
        { phoneme: 'F', spelling: CONSONANT_MAP.F, examples: 'fat, laugh' },
        { phoneme: 'V', spelling: CONSONANT_MAP.V, examples: 'van, love' },
        { phoneme: 'TH', spelling: CONSONANT_MAP.TH, examples: 'think, bath' },
        { phoneme: 'DH', spelling: CONSONANT_MAP.DH, examples: 'the, this' },
        { phoneme: 'S', spelling: CONSONANT_MAP.S, examples: 'sat, miss' },
        { phoneme: 'Z', spelling: CONSONANT_MAP.Z, examples: 'zoo, is' },
        { phoneme: 'SH', spelling: CONSONANT_MAP.SH, examples: 'she, push' },
        { phoneme: 'ZH', spelling: CONSONANT_MAP.ZH, examples: 'measure, beige' },
        { phoneme: 'HH', spelling: CONSONANT_MAP.HH, examples: 'hat, ahead' },
      ],
    },
    {
      name: 'Affricates',
      sounds: [
        { phoneme: 'CH', spelling: CONSONANT_MAP.CH, examples: 'chat, batch' },
        { phoneme: 'JH', spelling: CONSONANT_MAP.JH, examples: 'just, edge' },
      ],
    },
    {
      name: 'Nasals',
      sounds: [
        { phoneme: 'M', spelling: CONSONANT_MAP.M, examples: 'man, come' },
        { phoneme: 'N', spelling: CONSONANT_MAP.N, examples: 'no, pen' },
        { phoneme: 'NG', spelling: CONSONANT_MAP.NG, examples: 'sing, thing' },
      ],
    },
    {
      name: 'Liquids & Glides',
      sounds: [
        { phoneme: 'L', spelling: CONSONANT_MAP.L, examples: 'let, well' },
        { phoneme: 'R', spelling: CONSONANT_MAP.R, examples: 'run, car' },
        { phoneme: 'W', spelling: CONSONANT_MAP.W, examples: 'wet, away' },
        { phoneme: 'Y', spelling: CONSONANT_MAP.Y, examples: 'yes, you' },
      ],
    },
  ];

  const renderGroup = (group: SoundGroup) => (
    <div key={group.name} className="sound-group">
      <h4>{group.name}</h4>
      <table className="mapping-table">
        <thead>
          <tr>
            <th>Spelling</th>
            <th>Examples</th>
            <th className="phoneme-header">CMU</th>
          </tr>
        </thead>
        <tbody>
          {group.sounds.map((sound) => (
            <tr key={sound.phoneme}>
              <td className="spelling-cell">{sound.spelling}</td>
              <td className="examples-cell">{sound.examples}</td>
              <td className="phoneme-cell">{sound.phoneme}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="spelling-guide">
      <div className="guide-intro">
        <h2>How Ingglish Works</h2>
        <p>
          Ingglish uses a <strong>one-to-one mapping</strong> between sounds and spellings. Each
          letter or letter combination always makes the same sound, so you can read any word aloud
          correctly without memorization.
        </p>
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
    </div>
  );
}

export default SpellingGuide;
