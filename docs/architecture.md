# Architecture Overview

High-level architecture of the Ingglish project.

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

The core package is a thin orchestration layer. It imports from the packages above and exports the public translation API.

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

Contraction handling ("don't", "I'm") lives inline in `forward.ts`/`reverse.ts`;
there is no separate contractions or language-detection module.

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

Supports both Ingglish and IPA input:

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
  "AH": "uh",
  "L": "l",
  "OW": "oh",
  ...
}
```

## DOM Library (`@ingglish/dom`)

Browser-only utilities for translating DOM content.

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

- **Chunked translation**: Uses `requestAnimationFrame` for smooth rendering on large pages
- **Tooltip support**: Wraps translated words in spans with original text on hover
- **Attribute translation**: Handles `title`, `alt`, `placeholder`, `aria-label`
- **Skip logic**: Respects `<code>`, `<pre>`, `.no-translate`, `contenteditable`
- **Pre-computed translations**: `applyTranslationsMap()` for external translation sources

Live MutationObserver handling (auto-translating dynamically added content) is
implemented in the Chrome extension's content script, not in this package.

## Website (`@ingglish/website`)

React single-page application with three main features:

### Components

```
src/
├── components/
│   ├── TextTranslator.tsx   # Bidirectional text translation
│   ├── UrlTranslator.tsx    # Web page translation
│   ├── SpellingGuide.tsx    # Phoneme mapping reference
│   ├── Extension.tsx        # Chrome extension info page
│   └── Docs.tsx             # Documentation viewer
├── contexts/
│   └── FormatContext.tsx    # Output format state (Ingglish/IPA)
├── hooks/
│   └── useUrlTranslator.ts  # URL fetching & translation logic
└── App.tsx                   # Tab navigation & routing
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

1. User enters URL
2. Website fetches via CORS proxy
3. HTML is written to sandboxed iframe
4. `translateDOM` from `@ingglish/dom` walks text nodes and translates
5. Links are intercepted for navigation within iframe

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

The extension uses a message-passing architecture to keep the content script lightweight:

- **Background service worker**: Loads the full CMU dictionary (~5MB) once
- **Content script**: Lightweight (~11KB), walks DOM and sends words to background for translation
- **Translation cache**: 50K entry in-memory cache in background for fast repeated lookups

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

1. **Debounced MutationObserver**: Waits 100ms for mutations to settle before processing,
   preventing freezes on sites with rapid DOM updates (e.g., infinite scroll)

2. **In-place format switching**: When switching between Ingglish and IPA, updates existing
   spans directly instead of restoring and re-translating the entire page

3. **Chunked DOM updates**: Uses `requestAnimationFrame` to apply translations in chunks
   of 50 elements, keeping the main thread responsive

4. **Pre-collected text nodes**: Passes pre-collected nodes to `applyTranslationsMap()`
   to avoid double DOM traversal

## CORS Proxy (`@ingglish/cors-proxy`)

Cloudflare Worker that proxies requests to bypass CORS restrictions.

```
┌────────────┐     ┌───────────────────┐     ┌─────────────┐
│  Website   │────>│ Cloudflare Worker │────>│ Target URL  │
│            │     │                   │     │             │
│            │<────│ + CORS headers    │<────│             │
└────────────┘     └───────────────────┘     └─────────────┘
```

**Security features:**
- Origin allowlist validation
- SSRF prevention (blocks private IP ranges: 127.*, 10.*, 172.16-31.*, 192.168.*, ::1)
- Protocol restriction (HTTP/HTTPS only)
- Content-Type checking (HTML only)
- Cache control headers (minimum 5 minutes)

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

All paths are linear (no quadratic or exponential complexity). Dictionary data is loaded on-demand via dynamic imports.

See [Performance](performance.md) for complexity tables, profiling scripts, and optimization guidelines.
