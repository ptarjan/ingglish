# API Reference

Complete API documentation for `@ingglish/core`.

## Installation

```bash
npm install @ingglish/core
```

## Translation Functions

### `translate(text)`

Translates English text to Ingglish. Automatically loads the dictionary.

```typescript
async function translate(text: string): Promise<string>
```

**Example:**
```typescript
import { translate } from '@ingglish/core';

await translate("Hello, world!"); // "huloh, werld!"
await translate("The quick brown fox"); // "dhu kwik brown fahks"
```

### `reverseTranslate(text)`

Translates Ingglish text back to English. Automatically loads the dictionary.

```typescript
async function reverseTranslate(text: string): Promise<string>
```

**Example:**
```typescript
import { reverseTranslate } from '@ingglish/core';

await reverseTranslate("huloh, werld!"); // "hello, world!"
```

## DOM Translation (Browser Only)

### `translateDOM(root, options?)`

Translates all text content within a DOM element. Automatically loads the dictionary.

```typescript
async function translateDOM(
  root: Element | Document,
  options?: DOMTranslatorOptions
): Promise<void>
```

**Options:**
```typescript
interface DOMTranslatorOptions {
  skipTags?: string[];        // Tags to skip (default: SCRIPT, STYLE, CODE, etc.)
  skipClasses?: string[];     // CSS classes to skip
  translateAttributes?: boolean; // Translate title, alt, placeholder (default: true)
  onProgress?: (processed: number, total: number) => void;
}
```

**Example:**
```typescript
import { translateDOM } from '@ingglish/core';

await translateDOM(document.body, {
  skipTags: ['CODE', 'PRE'],
  translateAttributes: true,
  onProgress: (done, total) => console.log(`${done}/${total}`)
});
```

### `observeAndTranslate(root, options?)`

Creates a MutationObserver that translates new content as it's added to the DOM.
Useful for single-page applications where content changes dynamically.

```typescript
async function observeAndTranslate(
  root: Element | Document,
  options?: DOMTranslatorOptions
): Promise<() => void>  // Returns stop function
```

**Example:**
```typescript
import { observeAndTranslate } from '@ingglish/core';

const stop = await observeAndTranslate(document.body);
// Later...
stop(); // Stop observing
```

## Sync API

These synchronous functions are available after the dictionary has been loaded
(e.g., after calling `translate()` or `translateDOM()`).

### `translateText(text)`

Synchronous version of `translate()`. Dictionary must already be loaded.

```typescript
function translateText(text: string): string
```

### `reverseTranslateText(text)`

Synchronous version of `reverseTranslate()`. Dictionary must already be loaded.

```typescript
function reverseTranslateText(text: string): string
```

## Phoneme Maps

For building spelling guide UIs or understanding the phoneme mappings.

### `VOWEL_MAP`

Mapping of ARPAbet vowel phonemes to Ingglish spellings.

```typescript
const VOWEL_MAP: Record<string, string>
// Example entries: { "AA": "ah", "AE": "a", "IY": "ee", ... }
```

### `CONSONANT_MAP`

Mapping of ARPAbet consonant phonemes to Ingglish spellings.

```typescript
const CONSONANT_MAP: Record<string, string>
// Example entries: { "TH": "th", "DH": "dh", "SH": "sh", ... }
```

## Types

```typescript
interface DOMTranslatorOptions {
  skipTags?: string[];
  skipClasses?: string[];
  translateAttributes?: boolean;
  onProgress?: (processed: number, total: number) => void;
}
```
