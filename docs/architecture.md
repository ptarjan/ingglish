# Architecture Overview

How the Ingglish project is organized: its packages, how they depend on each other, and how text flows through them.

Two terms come up throughout. Pronunciations come from the CMU Pronouncing Dictionary (Carnegie Mellon University's pronunciation list), which writes sounds in **ARPAbet**, a plain-ASCII phoneme notation. **G2P** (grapheme-to-phoneme) means guessing a word's pronunciation from its spelling.

## Project Structure

```
ingglish/
├── packages/
│   ├── normalize/      # Text cleanup, case handling, tokenization, word patterns
│   ├── phonemes/       # Phoneme data + conversion
│   ├── dictionary/     # CMU dict, lookup, frequency
│   ├── g2p/            # Rule-based grapheme-to-phoneme
│   ├── ipa/            # IPA ↔ ARPAbet conversion
│   ├── shavian/        # Shavian alphabet conversion
│   ├── deseret/        # Deseret alphabet conversion
│   ├── fallback/       # Unknown word strategies
│   ├── core/           # Translation API (translate + reverse)
│   ├── dom/            # DOM translation utilities
│   ├── website/        # React web application
│   ├── extension/      # Chrome extension
│   └── cors-proxy/     # Cloudflare Worker proxy
├── docs/               # Documentation
└── .github/            # CI/CD workflows
```

## Package Dependencies

```
@ingglish/normalize (0 deps)
@ingglish/phonemes  (0 deps) ◄┐
@ingglish/dictionary (0 deps) ◄┤
@ingglish/g2p ──► phonemes    ◄┼── @ingglish/fallback
                               │
@ingglish/ipa ──► phonemes     │
@ingglish/shavian ──► phonemes + dictionary
@ingglish/deseret ──► phonemes + dictionary
                               │
ingglish ◄── all above packages
       ▲
@ingglish/dom ──► @ingglish/normalize (peer: core)
       ▲
@ingglish/website ──► @ingglish/dom + ingglish
@ingglish/extension ──► ingglish
```

## Library Packages

### `@ingglish/normalize` - Text cleanup, case handling, tokenization

```
src/
├── index.ts            # Barrel exports
├── case.ts             # Case pattern detection/application, splitCamelCase
├── text.ts             # normalizeApostrophes, stripDiacritics, URL/email preservation
└── tokenize.ts         # WORD_SPLIT_REGEX, WORD_TEST_REGEX, tokenizeText, tokenizeIPA, etc.
```

### `@ingglish/phonemes` - Phoneme data + conversion

```
src/
├── index.ts            # Barrel exports
├── arpabet.ts          # ARPAbet phoneme definitions
├── phonotactics.ts     # English sound rules for stress
├── types.ts            # OutputFormat type
├── to-ingglish.ts      # ARPAbet → Ingglish
├── from-ingglish.ts    # Ingglish → ARPAbet
├── ingglish-maps.ts    # Phoneme mapping tables
├── custom-format.ts    # Custom format registration
└── format-registry.ts  # Format registry for extensible output
```

### `@ingglish/dictionary` - CMU dict, lookup, frequency

```
src/
├── index.ts            # Barrel exports
├── loader.ts           # Load and cache CMU dictionary
├── lookup.ts           # Word pronunciation lookup
├── reverse.ts          # Build reverse index (phoneme → words)
├── frequency.ts        # Word frequency ranking
├── custom-words.ts     # Custom pronunciations (tech terms)
└── data/               # Generated dictionary and frequency data
```

### `@ingglish/g2p` - Rule-based grapheme-to-phoneme

```
src/
├── index.ts            # Public API
├── g2p-rules.ts        # Core G2P conversion rules
├── stress.ts           # Stress assignment
└── stress.test.ts      # Stress prediction tests
```

### `@ingglish/ipa` - IPA ↔ ARPAbet conversion

```
src/
├── index.ts            # Barrel exports
├── to-ipa.ts           # ARPAbet → IPA with stress
└── from-ipa.ts         # IPA → ARPAbet
```

### `@ingglish/shavian` - Shavian alphabet conversion

```
src/
├── index.ts            # Barrel exports
├── to-shavian.ts       # ARPAbet → Shavian
├── from-shavian.ts     # Shavian → ARPAbet
├── shavian-maps.ts     # Shavian mapping tables
└── tokenize.ts         # Shavian tokenization
```

### `@ingglish/deseret` - Deseret alphabet conversion

```
src/
├── index.ts            # Barrel exports
├── to-deseret.ts       # ARPAbet → Deseret
├── from-deseret.ts     # Deseret → ARPAbet
├── deseret-maps.ts     # Deseret mapping tables
└── tokenize.ts         # Deseret tokenization
```

### `@ingglish/fallback` - Unknown word strategies

```
src/
├── index.ts            # Fallback orchestration
├── acronyms.ts         # Acronym/initialism handling
├── compounds.ts        # Compound word splitting
├── stemming.ts         # Base word + suffix matching
└── british.ts          # British spelling variants
```

### `ingglish` - Translation API

The core package is a thin layer that ties the packages above together and exports the public translation API.

```
src/
├── index.ts            # Public API: translate, reverseTranslate, Sync variants
├── dict-loader.ts      # Per-language dictionary registration/loading
├── register-english.ts # Registers the English dictionary loader
└── translate/          # Translation logic
    ├── index.ts        # Re-exports the translate/reverse API
    ├── forward.ts      # English → Ingglish/IPA (incl. contractions)
    ├── reverse.ts      # Ingglish/IPA → English (incl. contractions)
    ├── pipeline.ts     # Shared tokenize → map → render stages
    └── preserved.ts    # URL/email preservation during translation
```

Contractions ("don't", "I'm") are handled directly in `forward.ts` and `reverse.ts`.
There is no separate module for contractions or language detection.

### Translation Flow

```
English Text
     │
     ▼
┌─────────────────┐
│  translateText  │ (format: 'ingglish' | 'ipa')
└────────┬────────┘
         │ tokenize
         ▼
┌─────────────────┐     ┌──────────────────────┐
│ translateWord   │────>│ lookupPronunciation  │
└────────┬────────┘     └────────┬─────────────┘
         │                       │
         │ found?                │ CMU Dictionary
         │                       │
    ┌────┴────┐                  │
    │         │                  ▼
    ▼         ▼           ┌──────────────┐
 phonemes   unknown       │   phonemes   │
    │         │           └──────┬───────┘
    │         │                  │
    │    ┌────┴────┐             │
    │    │ stemming│             │
    │    │  rules  │             │
    │    └────┬────┘             │
    │         │                  │
    └────┬────┘                  │
         │                       │
         ▼                       │
┌────────────────────┐           │
│   Output Format?   │<──────────┘
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Ingglish    IPA
    │         │
    ▼         ▼
┌───────────┐ ┌───────────┐
│ phonemes  │ │phonemesTo │
│ToIngglish │ │   IPA     │
└─────┬─────┘ └─────┬─────┘
      │             │
      ▼             ▼
 "haloh"       "/həˈloʊ/"
```

### Reverse Translation Flow

Reverse translation accepts either Ingglish or IPA input:

```
Ingglish Text          IPA Text
     │                     │
     ▼                     ▼
┌─────────────────┐  ┌────────────────────┐
│reverseTranslate │  │ reverseTranslate   │
│     Text        │  │     IPAText        │
└────────┬────────┘  └─────────┬──────────┘
         │                     │
         ▼                     ▼
┌────────────────────┐  ┌────────────────────┐
│ingglishToPhonemes  │  │   ipaToArpabet     │
└─────────┬──────────┘  └─────────┬──────────┘
          │                       │
          └───────────┬───────────┘
                      │
                      ▼
         ┌─────────────────────┐
         │  lookupByPhonemes   │  Reverse dictionary lookup
         └────────┬────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │   sortByFrequency   │  Rank homophones
         └────────┬────────────┘
                  │
                  ▼
            English Text (most common match)
```

### Key Data Structures

**CMU Dictionary**
```typescript
// Word → Phoneme array (pre-split at build time)
{
  "hello": ["HH", "AH0", "L", "OW1"],
  "world": ["W", "ER1", "L", "D"],
  ...
}
```

**Reverse Dictionary** (built at runtime)
```typescript
// Phoneme key → English words (sorted by frequency)
Map<string, string[]>
{
  "T UW": ["to", "too", "two"],
  "DH EH R": ["there", "their", "they're"],
  ...
}
```

**Phoneme Map**
```typescript
// ARPAbet → Ingglish spelling
{
  "HH": "h",
  "AH": "uh",   // stressed; unstressed AH0 → "a"
  "L": "l",
  "OW": "oh",
  ...
}
```

## DOM Library (`@ingglish/dom`)

Browser-only tools for translating the text of a live web page (its DOM).

### Module Structure

```
src/
├── index.ts                    # Public API exports
├── types.ts                    # DOMTranslatorOptions interface
├── translate/                  # DOM translation logic
│   ├── index.ts                # translateDOM orchestration
│   ├── translator.ts           # Core DOM translation algorithm
│   ├── apply-map.ts            # Apply pre-computed translations
│   ├── chunked.ts              # requestAnimationFrame chunked processing
│   ├── restore.ts              # Restore original text
│   └── tooltip-fragment.ts     # Hover tooltip HTML generation
└── traversal/                  # DOM traversal
    ├── index.ts                # Traversal exports
    ├── browser.ts              # Browser detection
    ├── extract.ts              # Word extraction from text nodes
    ├── skip-rules.ts           # Skip logic for tags/classes
    ├── text-nodes.ts           # TreeWalker and text node utilities
    └── tooltip.ts              # Tooltip styling utilities
```

Public API: `translateDOM` / `translateDOMSync`, `restoreDOM`, and
`applyTranslationsMap`, plus traversal helpers (`collectTextNodes`,
`extractWordsFromNodes`, `injectTooltipStyles`, `injectTooltipBehavior`).

### Key Features

- **Chunked translation**: Spreads work across frames with `requestAnimationFrame`, so large pages stay smooth
- **Tooltips**: Wraps each translated word in a span that shows the original text on hover
- **Attribute translation**: Also translates `title`, `alt`, `placeholder` and `aria-label`
- **Skip rules**: Leaves `<code>`, `<pre>`, `.no-translate` and `contenteditable` content untouched
- **Pre-computed translations**: `applyTranslationsMap()` applies translations produced elsewhere

Translating content that appears after the page loads (via a MutationObserver) happens
in the Chrome extension's content script, not in this package.

## Website (`@ingglish/website`)

A React single-page application. Each page is its own route, and every page except the tutorial is lazy-loaded:

### Components

```
src/
├── components/
│   ├── Tutorial.tsx         # Home page: interactive introduction (sections in tutorial/)
│   ├── TextTranslator.tsx   # Bidirectional text translation
│   ├── UrlTranslator.tsx    # Web page translation
│   ├── SpellingGuide.tsx    # Phoneme mapping reference
│   ├── WordExplorer.tsx     # Per-word breakdown of spelling and sound
│   ├── Experiment.tsx       # Custom mappings, scored by lib/mapping-metrics.ts
│   ├── Games.tsx            # Reading and spelling games (games/)
│   ├── Extension.tsx        # Chrome extension info page
│   └── Docs.tsx             # Documentation viewer
├── contexts/
│   └── FormatContext.tsx    # Output format state (Ingglish/IPA)
├── hooks/
│   └── useUrlTranslator.ts  # URL fetching & translation logic
├── routes-config.tsx        # Route table
└── AppLayout.tsx            # Tab navigation shell
```

### URL Translation Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Browser   │────>│ CORS Proxy  │────>│ Target Site  │
│   (iframe)  │     │  (Worker)   │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│ translateDOM│  In-place DOM modification
└─────────────┘
```

1. The user enters a URL
2. The website fetches the page through the CORS proxy
3. The HTML is written into a sandboxed iframe
4. `translateDOM` from `@ingglish/dom` walks the page's text and translates it
5. Clicked links are intercepted so navigation stays inside the iframe

## Chrome Extension (`@ingglish/extension`)

### Components

```
src/
├── manifest.json     # Extension configuration
├── content-script.ts   # Content script (DOM walking + message passing)
├── background.ts     # Service worker (holds dictionary ~5MB)
└── popup.ts          # Popup UI
```

### Architecture

The extension keeps the script injected into each page small by passing messages to a background worker that does the heavy lifting:

- **Background service worker**: Loads the full CMU dictionary (~5MB) once
- **Content script**: Small (~11KB); walks the page and sends its words to the background worker for translation
- **Translation cache**: The background worker keeps up to 50K translations in memory, so repeated words are fast

### Flow

```
┌──────────────┐     ┌──────────────┐
│   Popup UI   │────>│   Message    │
│ (popup.ts)   │     │   Passing    │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
┌──────────────────────────────────────────────────┐
│              Content Script (content-script.ts)    │
│  • Walks DOM, collects text nodes                │
│  • Sends batches of words to background          │
│  • Applies translations in chunks (RAF)          │
│  • Debounced MutationObserver (100ms)            │
│  • In-place span updates for format switching    │
└──────────────────────┬───────────────────────────┘
                       │ chrome.runtime.sendMessage
                       ▼
┌──────────────────────────────────────────────────┐
│              Background (background.ts)          │
│  • Loads CMU dictionary on startup               │
│  • Caches translations (50K entries, FIFO)       │
│  • Returns translated words                      │
│  • Manages tab-specific translation state        │
└──────────────────────────────────────────────────┘
```

### Performance Optimizations

1. **Debounced MutationObserver**: Waits until page changes have been quiet for 100ms before
   translating them, so sites that update constantly (e.g., infinite scroll) don't freeze

2. **In-place format switching**: Switching between Ingglish and IPA updates the existing
   spans directly instead of restoring and re-translating the whole page

3. **Chunked DOM updates**: Applies translations 50 elements at a time with
   `requestAnimationFrame`, so the page stays responsive

4. **Pre-collected text nodes**: Passes the text nodes it already collected to
   `applyTranslationsMap()`, so the page is not walked twice

## CORS Proxy (`@ingglish/cors-proxy`)

A Cloudflare Worker that fetches pages on the website's behalf. Browsers block a site from reading most other sites' pages directly (CORS restrictions); the proxy adds the headers that allow it.

```
┌────────────┐     ┌───────────────────┐     ┌─────────────┐
│  Website   │────>│ Cloudflare Worker │────>│ Target URL  │
│            │     │                   │     │             │
│            │<────│ + CORS headers    │<────│             │
└────────────┘     └───────────────────┘     └─────────────┘
```

**Security features:**
- Only accepts requests from allowlisted origins
- Blocks requests to private IP ranges (127.*, 10.*, 172.16-31.*, 192.168.*, ::1), so it can't be used to reach internal servers (server-side request forgery, SSRF)
- Only fetches HTTP/HTTPS URLs
- Only returns HTML (checks Content-Type)
- Sets cache headers (minimum 5 minutes)

## Data Flow Summary

```
┌───────────────────────────────────────────────────────────────────┐
│                         Build Time                                │
├───────────────────────────────────────────────────────────────────┤
│  CMU Dictionary (126K words) ──> bundled with @ingglish/dictionary│
│  SUBTLEX Frequencies (74K) ──> bundled with @ingglish/dictionary  │
└───────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Runtime                              │
├─────────────────────────────────────────────────────────────┤
│  loadDictionary() ──> parse & cache dictionary              │
│  translateText() ──> O(n) word lookup + phoneme conversion  │
│  reverseTranslate() ──> O(1) phoneme key lookup + frequency │
└─────────────────────────────────────────────────────────────┘
```

Every path runs in linear time or better; none is quadratic or exponential. Dictionary data is loaded only when needed, via dynamic imports.

See [Performance](performance.md) for complexity tables, profiling scripts, and optimization guidelines.
