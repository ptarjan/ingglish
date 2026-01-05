# API Reference

Complete API documentation for `@ingglish/core`.

## Installation

```bash
npm install @ingglish/core
```

## Dictionary Functions

### `loadDictionary()`

Loads the CMU Pronouncing Dictionary. Must be called before using translation functions.

```typescript
async function loadDictionary(): Promise<CMUDictionary>
```

**Returns:** Promise that resolves to the dictionary object.

**Example:**
```typescript
import { loadDictionary } from '@ingglish/core';

await loadDictionary();
// Dictionary is now loaded and cached
```

### `isDictionaryLoaded()`

Checks if the dictionary has been loaded.

```typescript
function isDictionaryLoaded(): boolean
```

### `getDictionary()`

Gets the dictionary synchronously. Throws if not loaded.

```typescript
function getDictionary(): CMUDictionary
```

### `getDictionaryStats()`

Returns statistics about the loaded dictionary.

```typescript
function getDictionaryStats(): { wordCount: number }
```

## Translation Functions

### `translateText(text)`

Translates English text to Ingglish.

```typescript
function translateText(text: string): string
```

**Parameters:**
- `text` - English text to translate

**Returns:** Ingglish translation

**Example:**
```typescript
translateText("Hello, world!"); // "huloh, werld!"
translateText("The quick brown fox"); // "dhu kwik brown fahks"
```

### `translateWord(word)`

Translates a single English word.

```typescript
function translateWord(word: string): string
```

### `translateTextAsync(text)`

Async version that loads dictionary first if needed.

```typescript
async function translateTextAsync(text: string): Promise<string>
```

### `translateWordAsync(word)`

Async version of `translateWord`.

```typescript
async function translateWordAsync(word: string): Promise<string>
```

## Reverse Translation

### `reverseTranslateText(inglishText)`

Translates Ingglish text back to English.

```typescript
function reverseTranslateText(inglishText: string): string
```

**Example:**
```typescript
reverseTranslateText("huloh, werld!"); // "hello, world!"
```

### `reverseTranslateWord(inglishWord)`

Translates a single Ingglish word back to English. Returns array of possible matches sorted by frequency.

```typescript
function reverseTranslateWord(inglishWord: string): string[]
```

**Example:**
```typescript
reverseTranslateWord("too"); // ["to", "too", "two"]
```

### `isLikelyInglish(text)`

Heuristically detects if text is Ingglish vs English.

```typescript
function isLikelyInglish(text: string): boolean
```

## Phoneme Functions

### `lookupPronunciation(word)`

Looks up a word's pronunciation in the CMU dictionary.

```typescript
function lookupPronunciation(word: string): string[] | null
```

**Returns:** Array of phonemes, or null if not found.

**Example:**
```typescript
lookupPronunciation("hello"); // ["HH", "AH0", "L", "OW1"]
```

### `phonemesToInglish(phonemes)`

Converts ARPAbet phonemes to Ingglish spelling.

```typescript
function phonemesToInglish(phonemes: string[]): string
```

**Example:**
```typescript
phonemesToInglish(["HH", "AH0", "L", "OW1"]); // "huloh"
```

### `inglishToPhonemes(inglish)`

Parses Ingglish text into phonemes.

```typescript
function inglishToPhonemes(inglish: string): string[] | null
```

### `stripStress(phoneme)`

Strips stress markers (0, 1, 2) from a phoneme.

```typescript
function stripStress(phoneme: string): string
```

**Example:**
```typescript
stripStress("AH0"); // "AH"
stripStress("OW1"); // "OW"
```

## Unknown Word Handling

### `translateUnknown(word)`

Translates words not in the dictionary using fallback strategies.

```typescript
function translateUnknown(word: string): string
```

**Strategy order:**
1. Try stemming (find known base word + suffix)
2. Try grapheme-to-phoneme rules

### `translateWithStemming(word)`

Attempts translation using stemming.

```typescript
function translateWithStemming(word: string): string | null
```

### `translateWithRules(word)`

Translates using grapheme-to-phoneme rules.

```typescript
function translateWithRules(word: string): string
```

### `wordToPhonemes(word)`

Converts a word to phonemes using grapheme-to-phoneme rules.

```typescript
function wordToPhonemes(word: string): string[]
```

## DOM Translation (Browser Only)

### `translateDOM(root, options?)`

Translates all text content within a DOM element.

```typescript
function translateDOM(
  root: Element | Document,
  options?: DOMTranslatorOptions
): void
```

**Options:**
```typescript
interface DOMTranslatorOptions {
  skipTags?: string[];        // Tags to skip (default: SCRIPT, STYLE, etc.)
  skipClasses?: string[];     // Classes to skip
  translateAttributes?: boolean; // Translate title, alt, placeholder
  onProgress?: (processed: number, total: number) => void;
}
```

**Example:**
```typescript
translateDOM(document.body, {
  skipTags: ['CODE', 'PRE'],
  translateAttributes: true,
  onProgress: (done, total) => console.log(`${done}/${total}`)
});
```

### `translateDOMAsync(root, options?)`

Async version that loads dictionary first.

```typescript
async function translateDOMAsync(
  root: Element | Document,
  options?: DOMTranslatorOptions
): Promise<void>
```

### `observeAndTranslate(root, options?)`

Creates a MutationObserver that translates new content as it's added.

```typescript
function observeAndTranslate(
  root: Element | Document,
  options?: DOMTranslatorOptions
): () => void  // Returns stop function
```

**Example:**
```typescript
const stop = observeAndTranslate(document.body);
// Later...
stop(); // Stop observing
```

### `skipElement(element)` / `unskipElement(element)`

Mark elements to be skipped/unskipped during translation.

```typescript
function skipElement(element: Element): void
function unskipElement(element: Element): void
```

## Constants

### `PHONEME_MAP`

Complete mapping of ARPAbet phonemes to Ingglish spellings.

```typescript
const PHONEME_MAP: Record<string, string>
```

### `VOWEL_MAP` / `CONSONANT_MAP`

Separate vowel and consonant mappings.

```typescript
const VOWEL_MAP: Record<string, string>
const CONSONANT_MAP: Record<string, string>
```

## Types

```typescript
type CMUDictionary = Record<string, string>;

interface DOMTranslatorOptions {
  skipTags?: string[];
  skipClasses?: string[];
  translateAttributes?: boolean;
  onProgress?: (processed: number, total: number) => void;
}
```
