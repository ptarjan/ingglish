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
├── translator.ts         # Main translation API
├── reverse-translator.ts # Ingglish/IPA → English
├── phoneme-map.ts        # ARPAbet → Ingglish mapping
├── arpabet-to-ipa.ts     # ARPAbet → IPA conversion
├── ipa-to-arpabet.ts     # IPA → ARPAbet conversion
├── unknown-words.ts      # Fallback strategies
├── word-frequency.ts     # Homophone ranking
├── case-utils.ts         # Case preservation
└── index.ts              # Public exports
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
"hulo"     "/həˈloʊ/"
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
├── dom-translator.ts     # translateDOM, restoreDOM
├── dom-observer.ts       # observeAndTranslate (MutationObserver)
├── dom-utils.ts          # Skip logic, element utilities
├── types.ts              # DOMTranslatorOptions
└── index.ts              # Public exports
```

### Key Features

- **Chunked translation**: Uses `requestAnimationFrame` for smooth rendering on large pages
- **Tooltip support**: Wraps translated words in spans with original text on hover
- **MutationObserver**: Auto-translates dynamically added content (SPAs)
- **Attribute translation**: Handles `title`, `alt`, `placeholder`, `aria-label`
- **Skip logic**: Respects `<code>`, `<pre>`, `.no-translate`, `contenteditable`

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
└──────────────────────┬───────────────────────────┘
                       │ chrome.runtime.sendMessage
                       ▼
┌──────────────────────────────────────────────────┐
│              Background (background.ts)           │
│  • Loads CMU dictionary on startup               │
│  • Caches translations (50K entries, FIFO)       │
│  • Returns translated words                      │
└──────────────────────────────────────────────────┘
```

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
- Origin allowlist
- URL validation
- Request/response size limits
- Blocked domains list

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
