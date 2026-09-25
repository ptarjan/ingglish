# Claude Development Notes

## CI/CD

Other sessions work in this repo at the same time. Always run `git pull --rebase`:

- before starting any work, and
- before every push: commit first, then pull, then push, so your commit is rebased onto any new remote changes.

Push directly to main. Never create PRs or feature branches. Always commit and push when you reach a good stopping point; don't wait to be asked.

When e2e tests fail in CI, download the `playwright-report` artifact from the failed run. It has screenshots and traces of the failure.

The Playwright e2e tests serve the website's built `dist/` via `vite preview`. Before running them locally, rebuild with `npx vite build` in packages/website, or you will test a stale bundle. The `Web Vitals › INP` tests are timing-sensitive and flake on a busy local machine; trust CI's result for those.

The dictionary artifacts (cmudict, reverse-cmudict, word-frequencies) are generated, not committed. The ensure script only checks that they exist, not that they are current. After changing generation logic in packages/dictionary/scripts/build-dictionary.ts (e.g. reverse-dictionary ranking), regenerate them by running `node scripts/ensure-dictionaries.cjs --force` in packages/dictionary.

## Testing & Linting

Use test-driven development (TDD): when possible, write a failing test first, then write the code that makes it pass.

- Target 100% line coverage for all packages.
- Use parameterized tests (`it.each`) to cut boilerplate: put tests that share an assertion pattern into one table.
- In tests, prefer the public API (`translateSync`, `reverseTranslateSync`) over internal methods. Vitest's source-map remapping loses coverage attribution across package boundaries, so tests of internals may not count.
- Load shared dictionaries once per file (e.g. a `loadEntries` cache), not once per test.

You don't need to run tests or lint by hand before pushing. The pre-push hook runs lint, type-check and tests for the changed packages, and blocks the push if anything fails.

For debugging, you can run any of these directly:

```bash
npx turbo test                # run all tests across all packages
npx vitest run packages/core  # run tests for a single package
npx turbo lint                # lint all packages
npx turbo build:fast          # build all packages (type-check + bundle)
```

## Code Comments

When a feature isn't complete, add a TODO comment in the code so the unfinished work stays tracked.

## Performance

Profile before optimizing. Don't guess at performance fixes; measure first to find the actual bottleneck.

## Quick Translation Testing

To test how words translate and round-trip:

```bash
cd packages/core
npm run translate -- "white wait hello world"
```

The output shows each word's translation and its reverse translation back to English:
```
✓ "white" -> "wait" -> "white"
✓ "wait" -> "wayt" -> "wait"
✓ "hello" -> "haloh" -> "hello"
```

For reverse translation (Ingglish → English):
```bash
npm run translate -- -r "haloh werld"
```

For non-English languages:
```bash
npm run translate -- -l fr "bonjour monde"
npm run translate -- -l ja "東京"
```

Run it with no arguments to list every available language code.

## Running Inline Scripts

In one-off `npx tsx -e` scripts, **top-level `await` does not work** because tsx outputs CommonJS. Wrap the code in an async function:

```bash
npx tsx --conditions=source -e "
async function main() {
  const { loadDictionary, lookupPronunciation } = await import('@ingglish/dictionary');
  await loadDictionary();
  console.log(lookupPronunciation('hello'));
}
main();
"
```

The `--conditions=source` flag resolves workspace packages to their TypeScript source files.

## Browsing Reddit

WebFetch cannot access reddit.com. Instead, append `.json` to the Reddit URL and fetch it with curl, sending a `User-Agent` header. Parse the JSON with python3, writing the script to a temp file to avoid shell-escaping problems.