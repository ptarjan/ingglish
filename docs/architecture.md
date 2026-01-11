# Architecture Overview

This document describes the high-level architecture of the Ingglish project.

## Project Structure

```
ingglish/
├── packages/
│   ├── core/           # Text translation library
│   ├── dom/            # DOM translation utilities
│   ├── website/        # React web application
│   ├── extension/      # Chrome extension
│   └── cors-proxy/     # Cloudflare Worker proxy
├── docs/               # Documentation
└── .github/            # CI/CD workflows
```

## Package Dependencies

```
@ingglish/website ──────┬──> @ingglish/dom ──> @ingglish/core
                        │                            │
                        └────────────────────────────┤
                                                     ├──> cmu-pronouncing-dictionary
@ingglish/extension ─────────────────────────────────┘──> subtlex-word-frequencies
```

## Core Library (`@ingglish/core`)

The core library handles text translation logic.

### Module Structure

```
src/
├── index.ts                    # Public API exports
├── types.ts                    # Type definitions
├── translate/                  # Translation logic
│   ├── forward.ts              # English → Ingglish/IPA
│   ├── reverse.ts              # Ingglish/IPA → English
│   ├── contractions.ts         # Handle "don't", "I'm", etc.
│   └── initialisms.ts          # Handle UI, API, URL, etc.
├── convert/                    # Format conversions
│   ├── to-ingglish.ts          # ARPAbet → Ingglish
│   ├── to-ipa.ts               # ARPAbet → IPA with stress
│   ├── from-ingglish.ts        # Ingglish → ARPAbet
│   ├── from-ipa.ts             # IPA → ARPAbet
│   └── ingglish-maps.ts        # Phoneme mapping tables
├── dictionary/                 # Dictionary management
│   ├── loader.ts               # Load and cache CMU dictionary
│   ├── lookup.ts               # Word pronunciation lookup
│   └── reverse.ts              # Build reverse index (phoneme → words)
├── fallback/                   # Unknown word strategies
│   ├── index.ts                # Fallback orchestration
│   ├── custom-words.ts         # Custom pronunciations (tech terms)
│   ├── acronyms.ts             # Acronym expansion
│   ├── compounds.ts            # Compound word splitting
│   ├── stemming.ts             # Base word + suffix matching
│   └── phonemize.ts            # Neural G2P wrapper
├── phonemes/                   # Phoneme handling
│   ├── arpabet.ts              # ARPAbet phoneme definitions
│   └── phonotactics.ts         # English sound rules for stress
└── utils/                      # Utility functions
    ├── text.ts                 # Text tokenization and parsing
    ├── case.ts                 # Case pattern detection/application
    └── frequency.ts            # Word frequency ranking
```

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
┌─────────────────┐     ┌──────────────────┐
│ translateWord   │────>│ lookupPronunciation
└────────┬────────┘     └────────┬─────────┘
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
┌────────┐ ┌───────────┐
│phoneme │ │phonemesTo │
│ToInglish│ │   IPA     │
└────┬───┘ └─────┬─────┘
     │           │
     ▼           ▼
"huloh"    "/həˈloʊ/"
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
┌─────────────────┐  ┌────────────────────┐
│inglishToPhonemes│  │   ipaToArpabet     │
└────────┬────────┘  └─────────┬──────────┘
         │                     │
         └──────────┬──────────┘
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
// Word → Phoneme string (space-separated)
{
  "hello": "HH AH0 L OW1",
  "world": "W ER1 L D",
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
  "AH": "u",
  "L": "l",
  "OW": "o",
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
│   ├── restore.ts              # Restore original text
│   └── tooltip-fragment.ts     # Hover tooltip HTML generation
├── observe/                    # Dynamic content handling
│   ├── index.ts                # observeAndTranslate entry point
│   └── observer.ts             # MutationObserver implementation
└── utils/                      # DOM utilities
    ├── index.ts                # Utility exports
    ├── browser.ts              # Browser detection
    ├── extract.ts              # Word extraction from text nodes
    ├── skip-rules.ts           # Skip logic for tags/classes
    ├── text-nodes.ts           # TreeWalker and text node utilities
    └── tooltip.ts              # Tooltip styling utilities
```

### Key Features

- **Chunked translation**: Uses `requestAnimationFrame` for smooth rendering on large pages
- **Tooltip support**: Wraps translated words in spans with original text on hover
- **MutationObserver**: Auto-translates dynamically added content (SPAs)
- **Attribute translation**: Handles `title`, `alt`, `placeholder`, `aria-label`
- **Skip logic**: Respects `<code>`, `<pre>`, `.no-translate`, `contenteditable`
- **Pre-computed translations**: `applyTranslationsMap()` for external translation sources

## Website (`@ingglish/website`)

React single-page application with three main features:

### Components

```
src/
├── components/
│   ├── TextTranslator.tsx   # Bidirectional text translation
│   ├── UrlTranslator.tsx    # Web page translation
│   └── SpellingGuide.tsx    # Phoneme mapping reference
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
├── content-lite.ts   # Lightweight content script (~11KB)
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
│              Content Script (content-lite.ts)     │
│  • Walks DOM, collects text nodes                │
│  • Sends batches of words to background          │
│  • Applies translations in chunks (RAF)          │
│  • Debounced MutationObserver (100ms)            │
│  • In-place span updates for format switching    │
└──────────────────────┬───────────────────────────┘
                       │ chrome.runtime.sendMessage
                       ▼
┌──────────────────────────────────────────────────┐
│              Background (background.ts)           │
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
┌─────────────────────────────────────────────────────────────┐
│                        Build Time                           │
├─────────────────────────────────────────────────────────────┤
│  CMU Dictionary (134K words) ──> bundled with @ingglish/core│
│  SUBTLEX Frequencies (74K) ──> bundled with @ingglish/core  │
└─────────────────────────────────────────────────────────────┘
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

## Performance Considerations

1. **Dictionary Loading**: ~3MB gzipped, loaded once and cached
2. **Translation**: O(n) where n = word count, dictionary lookup is O(1)
3. **Reverse Translation**: Builds reverse map on first use, O(n) for n words
4. **DOM Translation**: Uses TreeWalker for efficient text node traversal
5. **Bundle Splitting**: Dictionary and word frequencies in separate chunks
