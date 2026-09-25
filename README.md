# Ingglish

[![CI](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml/badge.svg)](https://github.com/ptarjan/ingglish/actions/workflows/ci.yml)

Ingglish is a phonemic spelling of English: each spelling always stands for the same sound, so you can read any word aloud from how it is written. This repo holds the translator and the site at **[ingglish.com](https://ingglish.com/)**, which converts text and web pages between English and Ingglish.

**[Try it live →](https://ingglish.com/)** · **[Spelling Guide](https://ingglish.com/guide)** · **[Docs](https://ingglish.com/docs)**

## Why?

My 5-year-old is learning to read, and I keep saying "sorry, that letter is silent" and "no, those letters make a different sound in this word." English spelling is inconsistent: "ough" alone has at least six pronunciations (though, through, rough, cough, thought, bough). In Ingglish, each spelling makes only one sound.

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

> **About the name:** "Ingglish" is how you spell "English" in Ingglish. To tell them apart out loud, stress the first syllable and pause briefly between the two g's: **ING·glish** vs. English.

## Packages

This monorepo contains these packages:

| Package | Description |
|---------|-------------|
| **ingglish** | Translation API: English to Ingglish and back |
| **@ingglish/normalize** | Text cleanup, case handling, tokenization |
| **@ingglish/phonemes** | Phoneme data and conversion between ARPAbet (ASCII phoneme codes), IPA and Ingglish |
| **@ingglish/dictionary** | CMU Pronouncing Dictionary, word lookup, word frequency |
| **@ingglish/g2p** | Rule-based grapheme-to-phoneme (G2P) conversion: guesses pronunciation from spelling |
| **@ingglish/fallback** | Strategies for words not in the dictionary (G2P, stemming, compound splitting) |
| **@ingglish/ipa** | IPA ↔ ARPAbet conversion |
| **@ingglish/shavian** | Shavian (an alternative English alphabet) ↔ ARPAbet conversion |
| **@ingglish/deseret** | Deseret (an alternative English alphabet) ↔ ARPAbet conversion |
| **@ingglish/dom** | Translates a web page in place (browser only) |
| **@ingglish/website** | React website that translates text and URLs |
| **@ingglish/extension** | Chrome extension that translates any web page |
| **@ingglish/cors-proxy** | Cloudflare Worker CORS proxy that fetches pages for the URL translator |

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
import { translateDOM, restoreDOM } from '@ingglish/dom';

// Translate DOM elements with hover tooltips showing the original word
await translateDOM(document.body, {
  showTooltips: true,
  chunked: true, // Smooth rendering for large pages
});

// Restore the original text
restoreDOM(document.body);
```

## Contributing

The [Contributing Guide](docs/contributing.md) covers development setup, testing and CLI scripts.

## License

MIT
