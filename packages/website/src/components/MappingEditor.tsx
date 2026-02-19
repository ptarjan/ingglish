import { useState, useCallback, useMemo } from 'react';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD, stripStress } from '@ingglish/phonemes';
import { arpabetPhonemeToIPA } from '@ingglish/ipa';
import {
  vowelGroups,
  consonantGroups,
  type SoundGroup,
  type SoundEntry,
} from './spelling-guide-data';
import type { UseCustomMappingReturn } from '../hooks/useCustomMapping';

function getIPA(phoneme: string): string {
  return arpabetPhonemeToIPA(phoneme).replace(/\u2060/g, '');
}

/** Get the default spelling for a phoneme */
function getDefault(phoneme: string): string {
  if (phoneme === 'AH0') {
    return 'a';
  }
  // For stress variants (EY0, EY1, etc.), fall back to the base phoneme's spelling
  return (
    ARPABET_TO_INGGLISH_MAP[phoneme] ??
    ARPABET_TO_INGGLISH_MAP[stripStress(phoneme)] ??
    phoneme.toLowerCase()
  );
}

function renderExamples(examples: string): React.ReactNode {
  const parts = examples.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

/** Check for duplicate spellings (two phonemes mapped to same spelling) */
function findDuplicates(phonemeMap: Record<string, string>): Map<string, string[]> {
  const spellingToPhonemes = new Map<string, string[]>();
  for (const [phoneme, spelling] of Object.entries(phonemeMap)) {
    if (spelling.length === 0) {
      continue;
    }
    const existing = spellingToPhonemes.get(spelling);
    if (existing) {
      existing.push(phoneme);
    } else {
      spellingToPhonemes.set(spelling, [phoneme]);
    }
  }
  // Only return entries with >1 phoneme (actual duplicates)
  const dupes = new Map<string, string[]>();
  for (const [spelling, phonemes] of spellingToPhonemes) {
    if (phonemes.length > 1) {
      dupes.set(spelling, phonemes);
    }
  }
  return dupes;
}

/** Check if a phoneme is a vowel (exists in the vowel map) */
const VOWEL_PHONEMES = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);

interface EditableCellProps {
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  isDuplicate?: boolean;
}

function EditableCell({ value, defaultValue, onChange, isDuplicate = false }: EditableCellProps) {
  const isChanged = value !== defaultValue;
  return (
    <td
      className={`ingglish-cell editable-cell ${isChanged ? 'cell-changed' : ''} ${isDuplicate ? 'cell-duplicate' : ''}`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className="cell-input"
        spellCheck={false}
      />
    </td>
  );
}

interface MappingEditorProps {
  mapping: UseCustomMappingReturn;
}

/** Stress variants for advanced mode */
const STRESS_VARIANTS = ['0', '1', '2'];

function MappingEditor({ mapping }: MappingEditorProps) {
  const [advancedMode, setAdvancedMode] = useState(false);

  const duplicates = useMemo(() => findDuplicates(mapping.phonemeMap), [mapping.phonemeMap]);

  const isDuplicate = useCallback((spelling: string) => duplicates.has(spelling), [duplicates]);

  const renderPhonemeRow = useCallback(
    (sound: SoundEntry) => {
      const { phoneme } = sound;

      // R-colored compound phonemes (AA+R, AO+R, etc.) are handled separately
      if (phoneme.includes('+')) {
        const base = phoneme.replace('+R', '');
        const currentPrefix = mapping.rColoredPrefixes[base] ?? R_COLORED_FORWARD.get(base) ?? '';
        const defaultPrefix = R_COLORED_FORWARD.get(base) ?? '';
        const defaultSpelling = defaultPrefix + 'r';
        const isChanged = currentPrefix !== defaultPrefix;

        return (
          <tr key={phoneme}>
            <td className="ipa-cell">{sound.ipaOverride ?? getIPA(phoneme)}</td>
            <td className={`ingglish-cell editable-cell ${isChanged ? 'cell-changed' : ''}`}>
              <div className="r-colored-input">
                <input
                  type="text"
                  value={currentPrefix}
                  onChange={(e) => {
                    mapping.setRColoredPrefix(base, e.target.value);
                  }}
                  className="cell-input"
                  spellCheck={false}
                />
                <span className="r-suffix">r</span>
              </div>
            </td>
            <td className="default-cell">{defaultSpelling}</td>
            <td className="examples-cell">{renderExamples(sound.examples)}</td>
          </tr>
        );
      }

      // Skip AH0 — it's shown as a sub-row under AH instead
      if (phoneme === 'AH0') {
        return null;
      }

      // ER is an r-colored vowel — force 'r' suffix like the compound R-colored phonemes
      if (phoneme === 'ER') {
        const currentSpelling = mapping.phonemeMap[phoneme] ?? getDefault(phoneme);
        const defaultSpelling = getDefault(phoneme);
        const currentPrefix = currentSpelling.endsWith('r')
          ? currentSpelling.slice(0, -1)
          : currentSpelling;
        const defaultPrefix = defaultSpelling.endsWith('r')
          ? defaultSpelling.slice(0, -1)
          : defaultSpelling;
        const isChanged = currentPrefix !== defaultPrefix;

        return (
          <tr key={phoneme}>
            <td className="ipa-cell">{getIPA(phoneme)}</td>
            <td className={`ingglish-cell editable-cell ${isChanged ? 'cell-changed' : ''}`}>
              <div className="r-colored-input">
                <input
                  type="text"
                  value={currentPrefix}
                  onChange={(e) => {
                    mapping.setPhonemeSpelling(phoneme, e.target.value + 'r');
                  }}
                  className="cell-input"
                  spellCheck={false}
                />
                <span className="r-suffix">r</span>
              </div>
            </td>
            <td className="default-cell">{defaultSpelling}</td>
            <td className="examples-cell">{renderExamples(sound.examples)}</td>
          </tr>
        );
      }

      // Regular phonemes
      const currentSpelling = mapping.phonemeMap[phoneme] ?? getDefault(phoneme);
      const defaultSpelling = getDefault(phoneme);

      // AH always shows AH0 (schwa) as an editable sub-row, since it has a distinct default
      const showSchwa = phoneme === 'AH';

      // In advanced mode, show stress variants for vowels
      if (
        (advancedMode || showSchwa) &&
        ARPABET_TO_INGGLISH_MAP[phoneme] !== undefined &&
        VOWEL_PHONEMES.has(phoneme)
      ) {
        // Which stress variants to show
        const variants = advancedMode ? STRESS_VARIANTS : showSchwa ? ['0'] : [];
        return (
          <>
            <tr key={phoneme}>
              <td className="ipa-cell">{getIPA(phoneme)}</td>
              <EditableCell
                value={currentSpelling}
                defaultValue={defaultSpelling}
                onChange={(v) => {
                  mapping.setPhonemeSpelling(phoneme, v);
                }}
                isDuplicate={isDuplicate(currentSpelling)}
              />
              <td className="default-cell">{defaultSpelling}</td>
              <td className="examples-cell">{renderExamples(sound.examples)}</td>
            </tr>
            {variants.map((stress) => {
              const stressedPhoneme = `${phoneme}${stress}`;
              const stressedDefault = getDefault(stressedPhoneme);
              const stressedValue = mapping.phonemeMap[stressedPhoneme] ?? stressedDefault;
              const stressLabel =
                stress === '0' ? 'unstressed' : stress === '1' ? 'primary' : 'secondary';
              // AH0 has a real default ('a'), other stress variants default to base
              const hasOwnDefault = stressedDefault !== defaultSpelling;
              return (
                <tr key={stressedPhoneme} className="stress-variant-row">
                  <td className="ipa-cell stress-label">
                    {phoneme}
                    {stress}
                  </td>
                  {hasOwnDefault ? (
                    <EditableCell
                      value={stressedValue}
                      defaultValue={stressedDefault}
                      onChange={(v) => {
                        mapping.setPhonemeSpelling(stressedPhoneme, v);
                      }}
                      isDuplicate={isDuplicate(stressedValue)}
                    />
                  ) : (
                    <td
                      className={`ingglish-cell editable-cell ${stressedValue !== defaultSpelling && stressedValue.length > 0 ? 'cell-changed' : ''}`}
                    >
                      <input
                        type="text"
                        value={mapping.phonemeMap[stressedPhoneme] ?? ''}
                        onChange={(e) => {
                          mapping.setPhonemeSpelling(stressedPhoneme, e.target.value);
                        }}
                        className="cell-input"
                        placeholder={currentSpelling}
                        spellCheck={false}
                      />
                    </td>
                  )}
                  <td className="default-cell">{hasOwnDefault ? stressedDefault : stressLabel}</td>
                  <td className="examples-cell">
                    {stressedPhoneme === 'AH0' &&
                      renderExamples(
                        '**a**bout (about), **u**pon (apon), penc**i**l (pensal), lem**o**n (leman)'
                      )}
                  </td>
                </tr>
              );
            })}
          </>
        );
      }

      return (
        <tr key={phoneme}>
          <td className="ipa-cell">{sound.ipaOverride ?? getIPA(phoneme)}</td>
          <EditableCell
            value={currentSpelling}
            defaultValue={defaultSpelling}
            onChange={(v) => {
              mapping.setPhonemeSpelling(phoneme, v);
            }}
            isDuplicate={isDuplicate(currentSpelling)}
          />
          <td className="default-cell">{defaultSpelling}</td>
          <td className="examples-cell">{renderExamples(sound.examples)}</td>
        </tr>
      );
    },
    [mapping, advancedMode, isDuplicate]
  );

  const renderGroup = useCallback(
    (group: SoundGroup) => (
      <div key={group.name} className="sound-group">
        <h4>{group.name}</h4>
        <table className="mapping-table experiment-table">
          <thead>
            <tr>
              <th>IPA</th>
              <th>Spelling</th>
              <th>Default</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>{group.sounds.map(renderPhonemeRow)}</tbody>
        </table>
      </div>
    ),
    [renderPhonemeRow]
  );

  const duplicateWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (const [spelling, phonemes] of duplicates) {
      warnings.push(`"${spelling}" is used for: ${phonemes.join(', ')}`);
    }
    return warnings;
  }, [duplicates]);

  return (
    <div className="mapping-editor">
      <div className="editor-controls">
        <label className="advanced-toggle">
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={(e) => {
              setAdvancedMode(e.target.checked);
            }}
          />
          Advanced mode (stress variants)
        </label>
      </div>

      {duplicateWarnings.length > 0 && (
        <div className="duplicate-warnings">
          <strong>Ambiguous spellings:</strong>
          <ul>
            {duplicateWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor-section">
        <h3>Vowels</h3>
        <div className="sound-groups">{vowelGroups.map(renderGroup)}</div>
      </div>

      <div className="editor-section">
        <h3>Consonants</h3>
        <div className="sound-groups">{consonantGroups.map(renderGroup)}</div>
      </div>
    </div>
  );
}

export default MappingEditor;
