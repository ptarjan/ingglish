type ForwardConverter = (arpabet: string[]) => string;
type ReverseTextConverter = (text: string) => string;

interface FormatHandler {
  forward?: ForwardConverter;
  reverseText?: ReverseTextConverter;
}

const registry = new Map<string, FormatHandler>();

export function registerFormat(name: string, handler: FormatHandler): void {
  const existing = registry.get(name);
  registry.set(name, { ...existing, ...handler });
}

export function getFormatHandler(name: string): FormatHandler | undefined {
  return registry.get(name);
}
