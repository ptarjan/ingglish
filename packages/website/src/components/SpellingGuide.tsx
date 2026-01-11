import { arpabetPhonemeToIPA, arpabetPhonemeToIngglish } from '@ingglish/core';
import { vowelGroups, consonantGroups, type SoundGroup } from './spelling-guide-data';

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
            <strong>Research-based</strong> - pronunciations from linguistic research
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

      <div className="guide-section">
        <h3>Special Cases</h3>
        <p>
          Beyond basic phonetic translation, Ingglish handles several edge cases:
        </p>

        <h4>Contractions</h4>
        <p>
          Contractions like "don't", "I'm", and "we'll" are translated as complete units using their
          dictionary pronunciations. The apostrophe is dropped since Ingglish spelling is
          unambiguous: don't → dont, I'm → iim, we'll → wiil. This ensures contractions round-trip
          correctly between English and Ingglish.
        </p>

        <h4>Case Preservation</h4>
        <p>
          Capitalization patterns are preserved during translation. ALL CAPS stays all caps, Title
          Case stays title case, and lowercase stays lowercase. For mixed case like "GitHub", the
          exact pattern is preserved position-by-position. The pronoun "I" becomes lowercase "ii" since Ingglish doesn't require capitalizing pronouns.
        </p>

        <h4>Initialisms</h4>
        <p>
          Initialisms like UI, API, and URL are translated by taking the first letter of each
          translated expansion word. For example, UI (User Interface) becomes YI because "user"
          translates to "yoozer" (Y) and "interface" translates to "interfays" (I). This preserves
          the initialism format while using Ingglish phonetics. Common initialisms stay all caps: UI
          → YI, API → API, URL → YRL.
        </p>

        <h4>Unknown Words</h4>
        <p>
          Words not in the dictionary (like tech terms, brand names, or neologisms) are handled
          through multiple fallback strategies: compound word splitting (GitHub → Git + Hub), known
          suffixes and prefixes (-tion, -ing, un-, re-), and rule-based grapheme-to-phoneme
          conversion. This ensures even invented words get reasonable phonetic spellings.
        </p>

        <h4>Reverse Translation</h4>
        <p>
          Ingglish can be translated back to English. The system matches phonetic spellings against
          the dictionary to find the original words. For homophones like "too", "to", and "two"
          (all spelled "too" in Ingglish), the most common word is chosen based on frequency data.
          Case patterns are preserved during reverse translation.
        </p>
      </div>
    </div>
  );
}

export default SpellingGuide;
