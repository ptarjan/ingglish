# Claude Development Notes

## CI/CD

Always `git pull --rebase` before starting any work to avoid conflicts with concurrent sessions. Also `git pull --rebase` before every push — do the pull after committing but before pushing, so your commit gets rebased on top of any new remote changes.

Push directly to main — don't create PRs or feature branches. Always commit and push whenever you reach a good stopping point — don't wait to be asked.

When e2e tests fail in CI, download the `playwright-report` artifact from the failed run to see screenshots and traces of what went wrong.

## Testing & Linting

Use test-driven development (TDD). When possible, write a failing test first, then write the code to make it pass.

Run `/simplify` before every push to catch dead code, unused files, and cleanup opportunities that the pre-push hook misses.

There is no need to manually run tests or lint before pushing — the pre-push hook runs lint, type-check, and tests for changed packages automatically and will block the push if anything fails.

All commands are available if you need them for debugging:

```bash
npx turbo test                # run all tests across all packages
npx vitest run packages/core  # run tests for a single package
npx turbo lint                # lint all packages
npx turbo build:fast          # build all packages (type-check + bundle)
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

WebFetch cannot access reddit.com. Append `.json` to any Reddit URL and use curl with a `User-Agent` header. Parse with python3 (write to a temp file to avoid shell escaping issues).