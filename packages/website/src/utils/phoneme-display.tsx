import { arpabetPhonemeToIPA } from '@ingglish/ipa';

/**
 * Get clean IPA symbol for a phoneme (without word joiners used for line-break prevention).
 */
export function getCleanIPA(phoneme: string): string {
  return arpabetPhonemeToIPA(phoneme).replace(/\u2060/g, '');
}

/**
 * Renders example text with **bold** markers converted to <strong> elements.
 */
export function renderExamples(examples: string): React.ReactNode {
  const parts = examples.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
