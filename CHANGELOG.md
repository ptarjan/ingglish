# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-16

### Added

#### @ingglish/core
- Bidirectional translation between English and phonetic spelling (Ingglish)
- IPA (International Phonetic Alphabet) output format with stress markers
- CMU Pronouncing Dictionary integration (134,000+ words)
- Neural G2P fallback via phonemize for unknown words
- Contraction support ("wouldn't", "can't", "you're", etc.)
- Case preservation (lowercase, UPPERCASE, Capitalized, camelCase)
- Initialism expansion (URL, HTML, API, etc.)
- Compound word splitting for unknown words
- Word frequency scoring for reverse translation disambiguation
- Both async and sync APIs

#### @ingglish/dom
- DOM translation with word-level hover tooltips
- Chunked rendering for smooth translation of large pages
- MutationObserver support for dynamic content (SPAs)
- Attribute translation (title, alt, placeholder, aria-label)
- Skip rules for code blocks, scripts, and no-translate elements

#### @ingglish/website
- Interactive text translator with live preview
- URL translator with fullscreen viewing mode
- Spelling guide with phoneme mappings
- Word correspondence highlighting on hover
- Mobile-responsive design

#### @ingglish/extension
- Chrome extension for translating any webpage
- Toggle translation on/off per tab
- Preserves page styling and layout

#### @ingglish/cors-proxy
- Cloudflare Worker for proxying URL translation requests
- HTML rewriting for relative links and assets

[1.0.0]: https://github.com/ptarjan/ingglish/releases/tag/v1.0.0
