# Ingglish Documentation

Ingglish is a phonemic spelling system for English: each spelling always stands for the same sound.

## Overview

- [Architecture](architecture.md) - How the system is built: packages, modules and data flow
- [Design Decisions](design-decisions.md) - Why each spelling was chosen
- [Dialect Assumptions](dialect-assumptions.md) - Why Ingglish follows General American pronunciation, and what that means for other accents

## Guides

- [Contributing](contributing.md) - Local setup, commands and pull requests
- [Deployment](deployment.md) - Deploying the website, Chrome extension and CORS proxy
- [Performance](performance.md) - Profiling, benchmarks and optimization
- [Troubleshooting](troubleshooting.md) - Common problems and how to fix them

## Analysis

- [Phoneme Mapping](phoneme-mapping.md) - Tables converting ARPAbet (the CMU dictionary's notation) to Ingglish and IPA
- [Mapping Quality Metrics](metrics.md) - How we score a sound-to-spelling mapping
- [Orthographic Transparency](orthographic-transparency.md) - How predictably spelling gives sound, and sound gives spelling
- [Morphological Preservation](morphological-analysis.md) - Which related words (sign, signal) still look related
- [Identical Words Analysis](identical-words-analysis.md) - Words spelled the same in English and Ingglish
- [False Friends Analysis](false-friends.md) - Ingglish spellings that happen to match a different English word
- [Spelling Iteration Log](spelling-iteration.md) - Every spelling we tried, changed or reverted

## Comparisons

- [Orthography Comparison](orthography-comparison.md) - How each Ingglish spelling compares with 37 languages
- [Spelling Reform Comparison](spelling-reform-comparison.md) - How Ingglish compares with past spelling reforms
- [Community Landscape](community-landscape.md) - A survey of reform proposals posted to r/conorthography

## API

- [Generated API Reference](generated/README.md) - Generated from the TypeScript source
