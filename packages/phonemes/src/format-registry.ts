type ForwardConverter = (arpabet: string[]) => string;
type ReverseTextConverter = (text: string) => string;

/** Token returned by reverse-with-mapping translation */
export interface ReverseToken {
  original: string;
  translated: string;
  isWord: boolean;
  matched?: boolean;
}

type ReverseTextWithMappingConverter = (text: string) => ReverseToken[];

export interface FormatHandler {
  forward?: ForwardConverter;
  reverseText?: ReverseTextConverter;
  reverseTextWithMapping?: ReverseTextWithMappingConverter;
  isLatinScript?: boolean;
  /** Whether case is preserved (caps, sentence start). Defaults to isLatinScript. */
  preservesCase?: boolean;
  /** Display name ('Ingglish', 'IPA', etc.) */
  label?: string;
  /** Display name in the format's own script (e.g. '𐑖𐑱𐑝𐑾𐑯' for Shavian) */
  nativeLabel?: string;
  /** Compound word join separator. Default '' */
  joinSeparator?: string;
}

const registry = new Map<string, FormatHandler>();

export function registerFormat(name: string, handler: FormatHandler): void {
  const existing = registry.get(name);
  registry.set(name, { ...existing, ...handler });
}

export function getFormatHandler(name: string): FormatHandler | undefined {
  return registry.get(name);
}

/**
 * Returns whether a format uses Latin script characters.
 * Defaults to true for unknown formats (safe for case handling).
 */
export function getFormatIsLatinScript(name: string): boolean {
  return registry.get(name)?.isLatinScript ?? true;
}

/**
 * Returns whether a format preserves case (capitalization, sentence start).
 * Falls back to isLatinScript, then true for unknown formats.
 */
export function getFormatPreservesCase(name: string): boolean {
  const handler = registry.get(name);
  return handler?.preservesCase ?? handler?.isLatinScript ?? true;
}

/**
 * Returns the display label for a format (e.g. 'Ingglish', 'IPA').
 * Falls back to the raw format name.
 */
export function getFormatLabel(name: string): string {
  return registry.get(name)?.label ?? name;
}

/**
 * Returns the native-script label for a format (e.g. '𐑖𐑱𐑝𐑾𐑯' for Shavian).
 * Falls back to the standard label, then the raw format name.
 */
export function getFormatNativeLabel(name: string): string {
  const handler = registry.get(name);
  return handler?.nativeLabel ?? handler?.label ?? name;
}

/**
 * Returns the join separator for compound word parts.
 * Defaults to '' (no separator).
 */
export function getFormatJoinSeparator(name: string): string {
  return registry.get(name)?.joinSeparator ?? '';
}
