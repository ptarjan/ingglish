import { arpabetPhonemeToIngglish } from '@ingglish/phonemes';
import { consonantGroups, type SoundGroup, vowelGroups } from '../data/spelling-guide-data';
import { getCleanIPA, renderExamples } from './phoneme-display';

function SpellingGuide(): React.JSX.Element {
  const renderGroup = (group: SoundGroup): React.JSX.Element => (
    <div className="sound-group" key={group.name}>
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
          {group.sounds
            .filter((sound) => !sound.note)
            .map((sound) => (
              <tr key={sound.phoneme}>
                <td className="ipa-cell">{sound.ipaOverride ?? getCleanIPA(sound.phoneme)}</td>
                <td className="ingglish-cell">
                  {sound.ingglishOverride ?? arpabetPhonemeToIngglish(sound.phoneme)}
                </td>
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
          People have proposed many{' '}
          <a
            href="https://en.wikipedia.org/wiki/English-language_spelling_reform"
            rel="noopener noreferrer"
            target="_blank"
          >
            spelling reforms
          </a>{' '}
          over the centuries:{' '}
          <a
            href="https://en.wikipedia.org/wiki/Benjamin_Franklin%27s_phonetic_alphabet"
            rel="noopener noreferrer"
            target="_blank"
          >
            Benjamin Franklin's phonetic alphabet
          </a>{' '}
          (1768), the{' '}
          <a
            href="https://en.wikipedia.org/wiki/Shavian_alphabet"
            rel="noopener noreferrer"
            target="_blank"
          >
            Shavian alphabet
          </a>{' '}
          (48 new characters) and{' '}
          <a
            href="https://en.wikipedia.org/wiki/Cut_Spelling"
            rel="noopener noreferrer"
            target="_blank"
          >
            Cut Spelling
          </a>{' '}
          (which drops silent letters).{' '}
          <a
            href="https://en.wikipedia.org/wiki/Noah_Webster#Spelling_reform"
            rel="noopener noreferrer"
            target="_blank"
          >
            Noah Webster
          </a>{' '}
          did simplify American spelling (color, center, dialog), but most reforms fail because they
          are either too radical to read or too timid to help.
        </p>
        <p>
          Ingglish takes a practical middle path. It keeps the{' '}
          <strong>familiar Latin alphabet</strong> and gives each sound{' '}
          <strong>exactly one spelling</strong>, so a letter or letter group always stands for the
          same sound. You can read any word aloud correctly without memorizing it, start reading
          right away without learning new letters, and type on any standard keyboard with no accents
          or special characters.
        </p>
      </div>

      <div className="guide-section">
        <h3>Key Principles</h3>
        <ul className="principles-list">
          <li>
            <strong>No silent letters:</strong> every letter is pronounced.
          </li>
          <li>
            <strong>Consistent spelling:</strong> the same sound is always spelled the same way.
          </li>
          <li>
            <strong>Readable aloud:</strong> anyone can pronounce an unfamiliar word correctly.
          </li>
          <li>
            <strong>Standardized:</strong> pronunciations come from linguistic research.
          </li>
        </ul>
      </div>

      <div className="guide-section">
        <h3>Vowels</h3>
        <div className="sound-groups">{vowelGroups.map((group) => renderGroup(group))}</div>
      </div>

      <div className="guide-section">
        <h3>Consonants</h3>
        <div className="sound-groups">{consonantGroups.map((group) => renderGroup(group))}</div>
      </div>

      <div className="guide-section">
        <h3>Unused Letters</h3>
        <p>
          Ingglish drops three English letters, because other letters already cover their sounds:
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
              <td className="examples-cell">cat → kat, city → sitee</td>
            </tr>
            <tr>
              <td className="ingglish-cell">q</td>
              <td className="examples-cell">k or kw</td>
              <td className="examples-cell">queen → kween</td>
            </tr>
            <tr>
              <td className="ingglish-cell">x</td>
              <td className="examples-cell">ks or z</td>
              <td className="examples-cell">box → boks, xylophone → zailafohn</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="guide-section">
        <h3>Special Cases</h3>
        <p>Beyond turning sounds into letters, Ingglish handles several special cases:</p>

        <h4>Contractions</h4>
        <p>
          Contractions like "don't", "I'm" and "we'll" are translated as whole words, using their
          dictionary pronunciations. The apostrophe is dropped because the Ingglish spelling is
          unambiguous without it: don't → dohnt, I'm → aim, we'll → weel. This way contractions
          translate back to English correctly.
        </p>

        <h4>Case Preservation</h4>
        <p>
          Translation keeps capitalization: Title Case stays title case and lowercase stays
          lowercase. A word with capitals inside it is translated in parts, and each part keeps its
          case: GitHub → GitHuhb, iPhone → aiFohn. The pronoun "I" becomes lowercase: I → ai,
          because its capital letter is an English writing convention, not part of the sound.
        </p>

        <h4>Initialisms</h4>
        <p>
          A word written entirely in capitals is left unchanged, because it is usually an initialism
          or acronym: UI → UI, HTML → HTML, NASA → NASA. Plurals like IDs and all-caps parts of
          longer words, like the GPT in ChatGPT, stay unchanged too. Contractions are the exception
          and are still translated: DON'T → DOHNT.
        </p>

        <h4>Unknown Words</h4>
        <p>
          Words missing from the dictionary, such as tech terms, brand names and newly coined words,
          go through several fallbacks: splitting words into parts (GitHub → GitHuhb), recognizing
          known prefixes and suffixes (un-, re-, -tion, -ing), and rules that work out the sounds
          from the letters. Even made-up words get a sensible phonetic spelling.
        </p>

        <h4>Reverse Translation</h4>
        <p>
          Ingglish can be translated back to English by looking up each spelling in the dictionary.
          When several words sound the same, like "too", "to" and "two" (all spelled "too" in
          Ingglish), the most common one is chosen, based on word-frequency data. Capitalization is
          kept in this direction too.
        </p>

        <h4>R-Colored Vowels</h4>
        <p>
          Some vowels blend with a following R into a single sound, called an r-colored vowel. The
          R-Colored Vowels table in the Vowels section above lists every one and its spelling.
        </p>

        <h4>Hyphen Separator</h4>
        <p>
          When two neighboring sounds would put three or more of the same letter in a row, Ingglish
          inserts a hyphen to keep the word readable. In "acquiesce", an "ee" sound is followed by a
          short "e" sound. Written together that would be "akweees", so Ingglish writes it with a
          hyphen: acquiesce → akwee-es. The same happens in translations from other languages.
        </p>
      </div>
    </div>
  );
}

export default SpellingGuide;
