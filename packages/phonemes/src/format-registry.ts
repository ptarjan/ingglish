import type { TranslatedToken } from './translated-token';

export interface FormatHandler {
  forward?: ForwardConverter;
  isLatinScript?: boolean;
  /** Compound word join separator. Default '' */
  joinSeparator?: string;
  /** Display name ('Ingglish', 'IPA', etc.) */
  label?: string;
  /** Display name in the format's own script (e.g. '𐑖𐑱𐑝𐑾𐑯' for Shavian) */
  nativeLabel?: string;
  /** Whether case is preserved (caps, sentence start). Defaults to isLatinScript. */
  preservesCase?: boolean;
  reverseText?: ReverseTextConverter;
  reverseTextWithMapping?: ReverseTextWithMappingConverter;
}
export type ForwardConverter = (arpabet: string[], options?: ForwardConverterOptions) => string;

export interface ForwardConverterOptions {
  /** Disable English R-coloring rules (vowel+R fusion). Use for foreign text. */
  disableRColoring?: boolean;
}

/** Internal resolved handler with defaults applied. */
interface ResolvedHandler extends FormatHandler {
  isLatinScript: boolean;
  joinSeparator: string;
  preservesCase: boolean;
}

type ReverseTextConverter = (text: string) => string;

type ReverseTextWithMappingConverter = (text: string) => TranslatedToken[];

const DEFAULT_HANDLER: ResolvedHandler = {
  isLatinScript: true,
  joinSeparator: '',
  preservesCase: true,
};

const registry = new Map<string, ResolvedHandler>();

export function getFormatHandler(name: string): FormatHandler | undefined {
  return registry.get(name);
}

/**
 * Returns whether a format uses Latin script characters.
 * Defaults to true for unknown formats (safe for case handling).
 */
export function getFormatIsLatinScript(name: string): boolean {
  return (registry.get(name) ?? DEFAULT_HANDLER).isLatinScript;
}

/**
 * Returns the join separator for compound word parts.
 * Defaults to '' (no separator).
 */
export function getFormatJoinSeparator(name: string): string {
  return (registry.get(name) ?? DEFAULT_HANDLER).joinSeparator;
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
 * Returns whether a format preserves case (capitalization, sentence start).
 * Falls back to isLatinScript, then true for unknown formats.
 */
export function getFormatPreservesCase(name: string): boolean {
  return (registry.get(name) ?? DEFAULT_HANDLER).preservesCase;
}

export function registerFormat(name: string, handler: FormatHandler): void {
  const existing = registry.get(name);
  const merged = { ...existing, ...handler };
  const isLatinScript = merged.isLatinScript ?? true;
  const resolved: ResolvedHandler = {
    ...merged,
    isLatinScript,
    joinSeparator: merged.joinSeparator ?? '',
    preservesCase: merged.preservesCase ?? isLatinScript,
  };
  registry.set(name, resolved);
}
