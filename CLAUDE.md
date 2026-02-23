# Claude Development Notes

## CI/CD

Push directly to main — don't create PRs or feature branches. Always commit and push whenever you reach a good stopping point — don't wait to be asked.

When e2e tests fail in CI, download the `playwright-report` artifact from the failed run to see screenshots and traces of what went wrong.

## Testing & Linting

Use test-driven development (TDD). When possible, write a failing test first, then write the code to make it pass.

All commands use turbo for parallelism and caching (~2s when cached):

```bash
npx turbo test                    # run all tests across all packages
npx vitest run packages/core  # run tests for a single package
npx turbo lint                # lint all packages
npx turbo build:fast          # build all packages (type-check + bundle)
```

**Before pushing cross-package changes**, run lint to catch type errors in dependent packages (lint-staged only checks staged files):

```bash
npx turbo lint
```

## Code Comments

Add TODO comments in the code when a feature isn't complete. This helps track unfinished work.

## Performance

Profile before optimizing. Don't guess at performance solutions - measure first to identify actual bottlenecks.

## Quick Translation Testing

To test how words translate and round-trip:

```bash
cd packages/core
npm run translate -- "white wait hello world"
```

Output shows each word's translation and reverse translation:
```
✓ "white" -> "wait" -> "white"
✓ "wait" -> "wayt" -> "wait"
✓ "hello" -> "haloh" -> "hello"
```

For reverse translation (Ingglish → English):
```bash
npm run translate -- -r "haloh werld"
```

This is useful for debugging translation issues and understanding how specific words behave.

## Running Inline Scripts

When using `npx tsx -e` for one-off scripts, **top-level `await` does not work** (tsx outputs CJS). Wrap in an async function:

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

You can use curl to browse Reddit's JSON API for research (e.g. spelling reform discussions, user feedback):

```bash
curl -s 'https://www.reddit.com/r/spelling/search.json?q=phonetic+spelling&limit=5' | jq '.data.children[].data.title'
```