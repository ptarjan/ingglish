import { VOWEL_MAP, CONSONANT_MAP } from '@ingglish/core';

function SpellingGuide() {
  // Sort entries alphabetically by spelling
  const vowelEntries = Object.entries(VOWEL_MAP).sort((a, b) => a[1].localeCompare(b[1]));
  const consonantEntries = Object.entries(CONSONANT_MAP).sort((a, b) => a[1].localeCompare(b[1]));

  const vowelExamples: Record<string, string> = {
    AA: 'father, hot',
    AE: 'cat, bat',
    AH: 'but, cup',
    AO: 'thought, law',
    EH: 'bed, red',
    ER: 'bird, her',
    IH: 'bit, sit',
    IY: 'bee, see',
    UH: 'book, put',
    UW: 'too, blue',
    AW: 'cow, out',
    AY: 'my, time',
    EY: 'say, day',
    OW: 'go, show',
    OY: 'boy, toy',
  };

  const consonantExamples: Record<string, string> = {
    B: 'bat, cab',
    D: 'dog, bed',
    G: 'go, big',
    K: 'cat, back',
    P: 'pat, cup',
    T: 'top, cat',
    DH: 'the, this',
    F: 'fat, laugh',
    S: 'sat, miss',
    SH: 'she,ush',
    TH: 'think, bath',
    V: 'van, love',
    Z: 'zoo, is',
    ZH: 'measure, beige',
    CH: 'chat, batch',
    JH: 'just, edge',
    M: 'man, come',
    N: 'no, pen',
    NG: 'sing, thing',
    L: 'let, well',
    R: 'run, car',
    W: 'wet, away',
    Y: 'yes, you',
    HH: 'hat, ahead',
  };

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
        <table className="mapping-table">
          <thead>
            <tr>
              <th>Spelling</th>
              <th>Sound</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            {vowelEntries.map(([phoneme, spelling]) => (
              <tr key={phoneme}>
                <td className="spelling-cell">{spelling}</td>
                <td className="phoneme-cell">{phoneme}</td>
                <td className="examples-cell">{vowelExamples[phoneme]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="guide-section">
        <h3>Consonants</h3>
        <table className="mapping-table">
          <thead>
            <tr>
              <th>Spelling</th>
              <th>Sound</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            {consonantEntries.map(([phoneme, spelling]) => (
              <tr key={phoneme}>
                <td className="spelling-cell">{spelling}</td>
                <td className="phoneme-cell">{phoneme}</td>
                <td className="examples-cell">{consonantExamples[phoneme]}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
