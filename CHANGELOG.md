# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

#### ingglish
- Digit-adjacent letter runs are no longer partially mistranslated. Ordinals
  and alphanumerics like "3rd", "21st", "win32", and "mp3" now pass through
  untranslated instead of producing output like "3rdee" or "ween32".

#### @ingglish/cors-proxy
- SSRF hardening: redirects are now followed manually with every hop
  re-validated against the protocol allowlist and private-network checks
  (previously only the initial URL was validated), and the private-network
  check now correctly handles bracketed IPv6 literals, IPv4-mapped, and
  link-local addresses.

### Changed

- The `translate`/`debug:roundtrip`/`analyze-collisions` CLI scripts (and all
  vite-node analysis scripts) now pass their arguments through correctly under
  vite-node 5 via the `--script` flag; foreign-language mode outputs Ingglish
  spellings instead of raw IPA.

## [1.0.0] - 2026-01-16

### Added

#### ingglish
- Bidirectional translation between English and phonetic spelling (Ingglish)
- IPA (International Phonetic Alphabet) output format with stress markers
- CMU Pronouncing Dictionary integration (126,000+ words)
- Rule-based G2P fallback for unknown words
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
