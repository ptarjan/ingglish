# Contributing Guide

Thanks for your interest in contributing to Ingglish!

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
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### Running the Website

```bash
npm run dev -w @ingglish/website
```

Open http://localhost:3000

### Running Tests

```bash
# All tests
npm test

# Core library only
npm test -w ingglish

# Website e2e tests
npm test -w @ingglish/website

# Watch mode (core)
npm run test:watch -w ingglish
```

### Linting & Formatting

```bash
# Check all linting (TypeScript + CSS)
npm run lint
npm run lint:css

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Run all checks (lint, format, test)
npm run check
```

## Project Structure

```
packages/
├── normalize/      # Text cleanup, case handling (0 deps)
├── phonemes/       # Phoneme data + conversion (0 deps)
├── tokenize/       # Tokenization, word patterns (→ normalize)
├── dictionary/     # CMU dict, lookup, frequency
├── fallback/       # Unknown word strategies (→ phonemes + dictionary)
├── core/           # Translation API (→ all above)
├── dom/            # DOM translation utilities (Browser only)
├── website/        # React web app (Vite + TypeScript)
├── extension/      # Chrome extension (Manifest V3)
└── cors-proxy/     # Cloudflare Worker (CORS proxy)
```

## Making Changes

### Core Library Changes

1. Make changes in `packages/core/src/`
2. Add tests in the corresponding `.test.ts` file
3. Run `npm run build -w ingglish` to rebuild
4. Run `npm test -w ingglish` to verify

### Website Changes

1. Make changes in `packages/website/src/`
2. Run `npm run dev -w @ingglish/website` for live reload
3. Run `npm test -w @ingglish/website` for e2e tests

### Extension Changes

1. Make changes in `packages/extension/src/`
2. Run `npm run build -w @ingglish/extension` to rebuild
3. Reload the extension in Chrome (`chrome://extensions` > refresh icon)

See [Deployment: Chrome Extension](deployment.md#chrome-extension-deployment) for build and loading instructions.

### Adding New ARPAbet Mappings

Edit `packages/phonemes/src/ingglish-maps.ts`:

```typescript
export const VOWEL_MAP: Record<string, string> = {
  // Add new ARPAbet vowel → Ingglish mappings here
};

export const CONSONANT_MAP: Record<string, string> = {
  // Add new ARPAbet consonant → Ingglish mappings here
};
```

For IPA conversion, edit `packages/phonemes/src/ipa-maps.ts`.

### Improving Unknown Word Handling

Edit files in `packages/fallback/src/`:

- `stemming.ts` - Add suffix rules
- `compounds.ts` - Add compound word patterns
- `acronyms.ts` - Add initialism handling
- `g2p-rules.ts` - Improve rule-based grapheme-to-phoneme conversion

For custom pronunciations (tech terms, brand names), edit `packages/dictionary/src/custom-words.ts`.

### Profiling Performance

Always profile before and after making optimization changes. See [Performance Guide](performance.md) for profiling scripts and benchmarks.

## Testing Guidelines

### Unit Tests

- Every new function should have tests
- Test edge cases (empty strings, special characters, etc.)
- Test round-trip translations where applicable
- Dictionary is pre-loaded globally via `vitest.setup.ts` (no manual setup needed)

Example:
```typescript
describe('translateWord', () => {
  it('should handle empty string', () => {
    expect(translateWord('')).toBe('');
  });

  it('should preserve case', () => {
    expect(translateWord('Hello')).toBe('Haloh');
    expect(translateWord('HELLO')).toBe('HALOH');
  });
});
```

### E2E Tests

Website e2e tests use Playwright:

```typescript
test('translates text', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="english-input"]', 'hello');
  await expect(page.locator('[data-testid="ingglish-output"]'))
    .toHaveValue('haloh');
});
```

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- No `any` types (use `unknown` if needed)
- Prefer `const` over `let`
- Use descriptive variable names

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
3. Run `npm run check` to lint, format check, and test
4. Commit with a descriptive message
5. Push and create a PR against `main`

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Formatting is correct (`npm run format:check`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions

## Reporting Issues

When reporting bugs, include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser/Node version
5. Example words that fail (if translation issue)

## Feature Requests

Before submitting:

1. Check existing issues for duplicates
2. Describe the use case
3. Suggest implementation if possible

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## See Also

- [Architecture](architecture.md) - How the codebase is organized
- [Performance](performance.md) - Profiling and benchmarking
- [Troubleshooting](troubleshooting.md) - Common issues and solutions
