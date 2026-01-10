# API Reference

API documentation for `@ingglish/core` and `@ingglish/dom`.

## Installation

```bash
npm install @ingglish/core
```

## Translation Functions

### `translate(text, format?)`

Translates English text to Ingglish or IPA. Automatically loads the dictionary.

```typescript
async function translate(
  text: string,
  format?: 'ingglish' | 'ipa'  // default: 'ingglish'
): Promise<string>
```

**Example:**
```typescript
import { translate } from '@ingglish/core';

// Default: Ingglish format
await translate("Hello, world!"); // "hulo, werld!"

// IPA format with stress markers
await translate("Hello, world!", 'ipa'); // "/həˈloʊ, wɝld!/"

// IPA stress markers are placed at syllable boundaries
await translate("beautiful", 'ipa'); // "/ˈbjutəfəl/"
```

### Reverse Translation

Reverse translation is performed synchronously via `reverseTranslateSync()` after the dictionary is loaded (by calling `translate()` first):

```typescript
import { translate, reverseTranslateSync } from '@ingglish/core';

// Load dictionary first
await translate("hello");

// Then reverse translate synchronously
reverseTranslateSync("hulo werld"); // "hello world"

// For IPA input, pass 'ipa' as the format:
reverseTranslateSync("həˈloʊ wɝld", 'ipa'); // "hello world"
```

## Sync API

These synchronous functions are available after the dictionary has been loaded
(e.g., after calling `translate()` or `translateDOM()`).

### `translateSync(text, format?)`

Synchronous version of `translate()`. Dictionary must already be loaded.

```typescript
function translateSync(text: string, format?: 'ingglish' | 'ipa'): string
```

### `translateSyncWithMapping(text, format?)`

Like `translateSync` but also returns a mapping of English words to translated words.

```typescript
function translateSyncWithMapping(
  text: string,
  format?: 'ingglish' | 'ipa'
): { result: string; mapping: Map<string, string> }
```

### `reverseTranslateSync(text, format?)`

Synchronous reverse translation. Dictionary must already be loaded.

```typescript
function reverseTranslateSync(
  text: string,
  format?: 'ingglish' | 'ipa'  // default: 'ingglish'
): string
```

**Example:**
```typescript
import { translate, translateSync, reverseTranslateSync } from '@ingglish/core';

// Load dictionary first
await translate("hello");

// Now use sync functions
const ingglish = translateSync("Hello, world!");
const english = reverseTranslateSync(ingglish);
const fromIPA = reverseTranslateSync("həˈloʊ", 'ipa');
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

## IPA Conversion

### `arpabetPhonemeToIPA(phoneme)`

Converts a single ARPAbet phoneme to IPA notation.

```typescript
function arpabetPhonemeToIPA(phoneme: string): string
```

**Example:**
```typescript
import { arpabetPhonemeToIPA } from '@ingglish/core';

arpabetPhonemeToIPA('TH');  // "θ"
arpabetPhonemeToIPA('DH');  // "ð"
arpabetPhonemeToIPA('AH0'); // "ə" (unstressed schwa)
arpabetPhonemeToIPA('EY1'); // "ˈeɪ" (stressed diphthong)
```

## Types

```typescript
// @ingglish/core
type OutputFormat = 'ingglish' | 'ipa';
```

---

# @ingglish/dom

Browser-only DOM translation utilities.

## Installation

```bash
npm install @ingglish/dom
```

## DOM Translation

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
  outputFormat?: 'ingglish' | 'ipa';  // Output format (default: 'ingglish')
  skipTags?: string[];        // Tags to skip (default: SCRIPT, STYLE, CODE, etc.)
  skipClasses?: string[];     // CSS classes to skip
  translateAttributes?: boolean; // Translate title, alt, placeholder (default: true)
  showTooltips?: boolean;     // Show original text on hover (default: false)
  chunked?: boolean;          // Use requestAnimationFrame for smooth rendering (default: false)
  chunkSize?: number;         // Nodes per frame when chunked (default: 100)
  onProgress?: (processed: number, total: number) => void;
}
```

**Example:**
```typescript
import { translateDOM } from '@ingglish/dom';

await translateDOM(document.body, {
  showTooltips: true,
  chunked: true,
  onProgress: (done, total) => console.log(`${done}/${total}`)
});
```

### `observeAndTranslate(root, options?)`

Creates a MutationObserver that translates new content as it's added to the DOM.
Useful for single-page applications where content changes dynamically.

```typescript
function observeAndTranslate(
  root: Element | Document,
  options?: DOMTranslatorOptions
): () => void  // Returns stop function
```

**Example:**
```typescript
import { observeAndTranslate } from '@ingglish/dom';

const stop = observeAndTranslate(document.body, { showTooltips: true });
// Later...
stop(); // Stop observing
```

### `restoreDOM(root)`

Restores translated text back to original English using stored data attributes.

```typescript
function restoreDOM(root: Element | Document): void
```

### `applyTranslationsMap(root, translations, options?)`

Applies pre-computed translations to DOM. Useful when translations are fetched separately
(e.g., from an extension's background script via message passing).

```typescript
async function applyTranslationsMap(
  root: Element | Document,
  translations: Record<string, string>,  // lowercase word → translated word
  options?: ApplyTranslationsOptions
): Promise<void>

interface ApplyTranslationsOptions {
  showTooltips?: boolean;      // Show original on hover (default: true)
  chunkSize?: number;          // Nodes per animation frame (default: 200)
  textNodes?: Text[];          // Pre-collected text nodes (avoids re-traversing DOM)
  onProgress?: (processed: number, total: number) => void;
}
```

**Example:**
```typescript
import { applyTranslationsMap, collectTextNodes } from '@ingglish/dom';

// Pre-collect text nodes for efficiency
const textNodes = collectTextNodes(document.body);

// Fetch translations from elsewhere (e.g., service worker)
const translations = await fetchTranslationsFromBackground(words);

// Apply with pre-collected nodes
await applyTranslationsMap(document.body, translations, { textNodes });
```

### `skipElement(element)` / `unskipElement(element)`

Programmatically mark elements to skip or include during translation.

```typescript
import { skipElement, unskipElement } from '@ingglish/dom';

skipElement(document.querySelector('.dynamic-content'));
// Later...
unskipElement(document.querySelector('.dynamic-content'));
```

## Types

```typescript
// @ingglish/dom
interface DOMTranslatorOptions {
  outputFormat?: OutputFormat;
  skipTags?: string[];
  skipClasses?: string[];
  translateAttributes?: boolean;
  showTooltips?: boolean;
  chunked?: boolean;
  chunkSize?: number;
  onProgress?: (processed: number, total: number) => void;
}
```
