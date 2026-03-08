/**
 * Post-processes TypeDoc markdown to link function/type names directly to source.
 * Transforms:
 *   ### FunctionName
 *   Defined in: [file.ts:line](url)
 * Into:
 *   ### [FunctionName](url)
 *
 * Also handles functions with code blocks between heading and "Defined in:".
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Transform TypeDoc markdown: link headings to source via "Defined in:" annotations.
 */
export function postprocessDocs(content) {
  // Match heading followed directly by "Defined in:" (for interfaces/types)
  const directPattern = /(#{2,5}) ([^\n]+)\n\nDefined in: \[[^\]]+\]\(([^)]+)\)/g;

  let result = content.replace(directPattern, (_, hashes, name, url) => {
    return `${hashes} [${name}](${url})`;
  });

  // Match heading followed by code block then "Defined in:" (for functions)
  const codeBlockPattern =
    /(#{2,5}) ([^\n]+)\n\n(```ts\n[\s\S]*?```)\n\nDefined in: \[[^\]]+\]\(([^)]+)\)/g;

  result = result.replace(codeBlockPattern, (_, hashes, name, codeBlock, url) => {
    return `${hashes} [${name}](${url})\n\n${codeBlock}`;
  });

  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = 'docs/generated/README.md';
  const content = readFileSync(file, 'utf-8');
  writeFileSync(file, postprocessDocs(content));
  console.log('Post-processed docs/generated/README.md');
}
