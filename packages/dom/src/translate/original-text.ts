/**
 * Original text for text nodes translated in place (non-tooltip mode).
 *
 * Text nodes can't carry attributes, and a single parent-level attribute
 * can't represent multiple translated text-node children, so originals live
 * here keyed by the mutated node. Tooltip mode doesn't need this — the
 * original words are stored on the word spans themselves.
 */

const originalTextByNode = new WeakMap<Text, string>();

/**
 * Records a text node's pre-translation content. A node that already has a
 * recorded original keeps it, so re-translating (e.g. a format switch)
 * doesn't overwrite the true original with translated text.
 */
export function rememberOriginalText(node: Text, original: string): void {
  if (!originalTextByNode.has(node)) {
    originalTextByNode.set(node, original);
  }
}

/**
 * Restores a text node's recorded original content, if any.
 * Returns true if the node was restored.
 */
export function restoreOriginalText(node: Text): boolean {
  const original = originalTextByNode.get(node);
  if (original === undefined) {
    return false;
  }
  node.textContent = original;
  originalTextByNode.delete(node);
  return true;
}
