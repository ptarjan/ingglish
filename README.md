# Inglish

Phonetic English spelling translator. Words are spelled exactly as they sound - no exceptions!

## Overview

Inglish translates English text into a consistent, phonetic spelling system where each sound has exactly one representation. Using the CMU Pronouncing Dictionary (134,000+ words), it eliminates the irregularities and exceptions that make English spelling notoriously difficult.

## Packages

This is a monorepo containing:

- **@inglish/core** - Core translation library (Node.js & Browser)
- **@inglish/website** - React website for text and URL translation
- **@inglish/extension** - Chrome extension for translating any webpage

## Installation

```bash
# Clone and install
git clone https://github.com/ptarjan/inglish.git
cd inglish
npm install

# Build all packages
npm run build
```

## Usage

### Core Library

```typescript
import { loadDictionary, translateText } from '@inglish/core';

// Load the dictionary (required once)
await loadDictionary();

// Translate text
const result = translateText('Hello, world!');
console.log(result); // "Huloh, werld!"

// Translate DOM elements (browser only)
import { translateDOM } from '@inglish/core';
translateDOM(document.body);
```

### Website

```bash
npm run dev -w @inglish/website
```

Then open http://localhost:3000

### Chrome Extension

```bash
# Build the extension
npm run build -w @inglish/extension

# Load in Chrome:
# 1. Go to chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select packages/extension/dist
```

## Phoneme Mapping

Each sound maps to exactly one spelling:

| Sound | Inglish | Examples |
|-------|---------|----------|
| Long "e" | ee | bee, see |
| Long "i" | ai | my, time |
| Long "o" | oh | go, show |
| Voiced "th" | dh | the, this |
| Unvoiced "th" | th | think, bath |
| Short "u" | u | but, cup |
| "aw" sound | aw | caught, law |
| "er" sound | er | bird, her |

See [docs/phoneme-mapping.md](docs/phoneme-mapping.md) for the complete mapping.

## Examples

| English | Inglish |
|---------|---------|
| hello | huloh |
| world | werld |
| beautiful | byootuful |
| through | throo |
| though | dhoh |
| thought | thawt |
| the | dhu |
| English | ingglihs |

## Development

```bash
# Run tests
npm test

# Build all packages
npm run build

# Run website dev server
npm run dev -w @inglish/website
```

## How Unknown Words Are Handled

For words not in the CMU dictionary, Inglish uses:

1. **Stemming** - Tries to find a known base word (e.g., "running" → "run" + "ing")
2. **Grapheme-to-phoneme rules** - Falls back to letter-to-sound conversion rules

## Deployment

### Website
Deploy to Vercel or Netlify with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ptarjan/inglish&root-directory=packages/website)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ptarjan/inglish)

See [docs/deployment.md](docs/deployment.md) for detailed deployment instructions.

### Chrome Extension
Build and load locally, or publish to Chrome Web Store.

## CI/CD

GitHub Actions workflow included for:
- Running tests on every PR
- Building all packages
- Auto-deploying to Vercel on merge to main

## License

MIT
