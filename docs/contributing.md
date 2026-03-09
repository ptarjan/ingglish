# Contributing Guide

## Getting Started

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/ingglish.git
   cd ingglish
   ```

2. **Install dependencies** (requires Node.js 20+)
   ```bash
   npm install
   ```

3. **Build all packages**
   ```bash
   npx turbo build:fast
   ```

4. **Run tests**
   ```bash
   npx turbo test
   ```

## Key Commands

```bash
npm run dev -w @ingglish/website   # Dev server at localhost:3000
npx turbo test                     # All tests (~2s when cached)
npx vitest run packages/core       # Single package tests
npx turbo lint                     # Lint all packages
npx turbo lint -- --fix            # Auto-fix lint issues
```

Before pushing cross-package changes, run `npx turbo lint` to catch type errors in dependent packages (lint-staged only checks staged files).

## CLI Scripts

```bash
cd packages/core

# Translate text (shows word-by-word breakdown)
npm run translate -- "Hello world"

# Reverse translate
npm run translate -- -r "haloh werld"

# Debug round-trip issues
npm run debug:roundtrip -- "beautiful"
```

## Project Structure

See [Architecture](architecture.md) for the full package dependency graph and module breakdown.

## Commit Messages

Follow conventional commits:

```
feat: add new phoneme mapping for X
fix: correct translation of contractions
docs: update API reference
test: add tests for reverse translation
refactor: simplify unknown word handling
```

## Pull Request Process

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes with tests
3. Run `npx turbo test lint` to verify
4. Commit with a descriptive message
5. Push and create a PR against `main`
