type ForwardConverter = (arpabet: string[]) => string;
type ReverseTextConverter = (text: string) => string;

export interface FormatHandler {
  forward?: ForwardConverter;
  reverseText?: ReverseTextConverter;
  isLatinScript?: boolean;
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
