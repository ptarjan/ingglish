# Ingglish

[![CI](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml/badge.svg)](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml)

Phonemic English spelling translator. Every spelling always makes the same sound.

**[Try it live →](https://ingglish.com/)** · **[Spelling Guide](https://ingglish.com/guide)** · **[Docs](https://ingglish.com/docs)**

## Why?

My 5-year-old is learning to read and I keep having to say "yeah sorry, that letter is silent" and "no, those letters make a different sound in this word." English spelling is broken — "ough" alone has at least six pronunciations (though, through, rough, cough, thought, bough). Ingglish fixes that.

## Examples

| English | Ingglish | IPA |
|---------|---------|-----|
| hello | haloh | /həˈloʊ/ |
| world | werld | /wɝld/ |
| beautiful | byootafal | /ˈbjutəfəl/ |
| through | throo | /θɹu/ |
| though | dhoh | /ðoʊ/ |
| thought | thawt | /θɔt/ |
| the | dha | /ðə/ |
| English | Ingglish | /ˈɪŋɡlɪʃ/ |

> **About the name:** "Ingglish" is simply how you spell "English" in Ingglish! When speaking, you can distinguish them by stressing the first syllable and pausing briefly between the two g's: **ING·glish** vs. English.

## Packages

This is a monorepo containing:

| Package | Description |
|---------|-------------|
| **ingglish** | Translation API — translate and reverse-translate text |
| **@ingglish/normalize** | Text cleanup, case handling, tokenization |
| **@ingglish/phonemes** | Phoneme data + ARPAbet/IPA/Ingglish conversion |
| **@ingglish/dictionary** | CMU dictionary, lookup, word frequency |
| **@ingglish/g2p** | Rule-based grapheme-to-phoneme conversion |
| **@ingglish/fallback** | Unknown word strategies (G2P, stemming, compounds) |
| **@ingglish/ipa** | IPA ↔ ARPAbet conversion |
| **@ingglish/shavian** | Shavian alphabet ↔ ARPAbet conversion |
| **@ingglish/deseret** | Deseret alphabet ↔ ARPAbet conversion |
| **@ingglish/dom** | DOM translation utilities (Browser only) |
| **@ingglish/website** | React website for text and URL translation |
| **@ingglish/extension** | Chrome extension for translating any webpage |
| **@ingglish/cors-proxy** | Cloudflare Worker CORS proxy for URL translation |

## Installation

### npm (recommended)

```bash
# Core library (text translation)
npm install ingglish

# DOM utilities (browser translation with tooltips)
npm install @ingglish/dom
```

### From source

```bash
git clone https://github.com/ptarjan/ingglish.git
cd ingglish
npm install
npm run build
```

## Usage

### Core Library

```typescript
import { translate, reverseTranslate } from 'ingglish';

// Translate English → Ingglish (async, auto-loads dictionary)
const ingglish = await translate('Hello, world!');
console.log(ingglish); // "Haloh, werld!"

// Translate English → IPA
const ipa = await translate('Hello, world!', { format: 'ipa' });
console.log(ipa); // "/həˈloʊ, wɝld!/"

// Translate Ingglish → English (async, loads dictionary + word frequencies)
const english = await reverseTranslate('haloh, werld!');
console.log(english); // "hello, world!"

// Translate IPA → English
const fromIpa = await reverseTranslate('/həˈloʊ, wɝld!/', { format: 'ipa' });
console.log(fromIpa); // "hello, world!"
```

### DOM Translation (Browser)

```typescript
import { translateDOM, observeAndTranslate } from '@ingglish/dom';

// Translate DOM elements with tooltips
await translateDOM(document.body, {
  showTooltips: true,
  chunked: true, // Smooth rendering for large pages
});

// Auto-translate dynamic content (SPAs)
const stop = observeAndTranslate(document.body);
// Later: stop() to disconnect observer
```

## Contributing

See the [Contributing Guide](docs/contributing.md) for development setup, testing, and CLI scripts.

## License

MIT
