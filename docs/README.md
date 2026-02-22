# Ingglish Documentation

Ingglish is a phonemic English spelling system where every spelling always makes the same sound.

## Overview

- [Architecture](architecture.md) - System design, data flow, module structure
- [Design Decisions](design-decisions.md) - Why Ingglish works the way it does
- [Dialect Assumptions](dialect-assumptions.md) - General American pronunciation choices and their impact

## Guides

- [Contributing](contributing.md) - Development setup and workflow
- [Deployment](deployment.md) - Deploy website, extension, and CORS proxy
- [Performance](performance.md) - Profiling, benchmarking, optimization
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## Analysis

- [Phoneme Mapping](phoneme-mapping.md) - ARPAbet to Ingglish/IPA conversion tables
- [Mapping Quality Metrics](metrics.md) - How we measure mapping quality
- [Orthographic Transparency](orthographic-transparency.md) - Feedforward/feedback consistency analysis
- [Morphological Preservation](morphological-analysis.md) - Impact on word family relationships
- [Identical Words Analysis](identical-words-analysis.md) - Words spelled the same in both systems
- [False Friends Analysis](collision-analysis.md) - Ingglish spellings that match different English words
- [Spelling Iteration Log](spelling-iteration.md) - What we tried, changed, and reverted

## Comparisons

- [Orthography Comparison](orthography-comparison.md) - How spellings compare to ~35 languages
- [Spelling Reform Comparison](spelling-reform-comparison.md) - How Ingglish compares to historical reforms
- [Community Landscape](community-landscape.md) - Survey of r/conorthography proposals

## API

- [Generated API Reference](generated/README.md) - Auto-generated from TypeScript
