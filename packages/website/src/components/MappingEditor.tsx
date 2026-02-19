import { useState, useCallback, useMemo } from 'react';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from '@ingglish/phonemes';
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
  return ARPABET_TO_INGGLISH_MAP[phoneme] ?? phoneme.toLowerCase();
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

      // Regular phonemes
      const currentSpelling = mapping.phonemeMap[phoneme] ?? getDefault(phoneme);
      const defaultSpelling = getDefault(phoneme);

      // In advanced mode, show stress variants for vowels
      if (
        advancedMode &&
        phoneme !== 'AH0' &&
        ARPABET_TO_INGGLISH_MAP[phoneme] !== undefined &&
        VOWEL_PHONEMES.has(phoneme)
      ) {
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
            {STRESS_VARIANTS.map((stress) => {
              const stressedPhoneme = `${phoneme}${stress}`;
              const stressedValue = mapping.phonemeMap[stressedPhoneme];
              const currentVal = stressedValue ?? '';
              const stressLabel =
                stress === '0' ? 'unstressed' : stress === '1' ? 'primary' : 'secondary';
              return (
                <tr key={stressedPhoneme} className="stress-variant-row">
                  <td className="ipa-cell stress-label">
                    {phoneme}
                    {stress}
                  </td>
                  <td
                    className={`ingglish-cell editable-cell ${currentVal.length > 0 && currentVal !== defaultSpelling ? 'cell-changed' : ''}`}
                  >
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => {
                        if (e.target.value.length > 0) {
                          mapping.setPhonemeSpelling(stressedPhoneme, e.target.value);
                        } else {
                          // Clear override by setting to default
                          mapping.setPhonemeSpelling(stressedPhoneme, defaultSpelling);
                        }
                      }}
                      className="cell-input"
                      placeholder={currentSpelling}
                      spellCheck={false}
                    />
                  </td>
                  <td className="default-cell">{stressLabel}</td>
                  <td className="examples-cell"></td>
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
