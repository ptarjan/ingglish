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

/**
 * Renders examples with dynamic translations using a translate function.
 * Replaces static "(ingglish)" parentheticals with live translations.
 *
 * Input format: `b**a**d (bad), pl**ai**d (plad)`
 * The English word is extracted by stripping **bold** markers from the text before each `(...)`.
 */
export function renderDynamicExamples(
  examples: string,
  translate: (word: string) => string
): React.ReactNode {
  // Split into segments: "b**a**d (bad)" becomes one segment per example
  const segments = examples.split(', ');
  return segments.map((segment, si) => {
    // Extract the parenthetical translation and the English word before it
    const match = /^(.+?)\s*\(([^)]+)\)$/.exec(segment);
    if (match === null) {
      // No parenthetical — render with bold markers only
      return (
        <span key={si}>
          {si > 0 ? ', ' : ''}
          {renderBoldParts(segment)}
        </span>
      );
    }

    const englishPart = match[1]!; // e.g. "b**a**d"
    // Strip bold markers to get the plain English word
    const plainWord = englishPart.replace(/\*\*/g, '');
    const translated = translate(plainWord);

    return (
      <span key={si}>
        {si > 0 ? ', ' : ''}
        {renderBoldParts(englishPart)} ({translated})
      </span>
    );
  });
}

function renderBoldParts(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
