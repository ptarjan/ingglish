# Claude Development Notes

## Git

Other sessions work in this checkout too. `git pull --rebase` before starting and before every push (commit, pull, push). Push straight to main; no PRs or branches. Commit and push at every good stopping point.

## Testing

- TDD where you can: failing test first.
- 100% line coverage per package. Use `it.each` tables for tests sharing an assertion.
- Test through the public API (`translateSync`, `reverseTranslateSync`); coverage isn't attributed across package boundaries.
- Load a shared dictionary once per file, not once per test.
- The pre-push hook runs lint, type-check and tests for changed packages. `npx turbo test|lint|build:fast` runs everything; `npx vitest run packages/core` runs one package.
- e2e tests serve the built `dist/`: run `npx vite build` in packages/website first. On failed CI e2e runs, download the `playwright-report` artifact. `Web Vitals › INP` flakes on a busy machine; trust CI.
- Dictionary artifacts are generated, not committed, and only checked for existence. After changing `packages/dictionary/scripts/build-dictionary.ts`, run `node scripts/ensure-dictionaries.cjs --force` in packages/dictionary.

## Code

- Unfinished feature: leave a TODO comment.
- Profile before optimizing.

## Trying translations

In packages/core:

```bash
npm run translate -- "white wait hello"     # ✓ "white" -> "wait" -> "white"
npm run translate -- -r "haloh werld"       # Ingglish → English
npm run translate -- -l fr "bonjour monde"  # other languages; no args lists codes
```

`npx tsx -e` scripts emit CommonJS, so wrap top-level `await` in an async function, and pass `--conditions=source` to resolve workspace packages to their TypeScript source.

## Reddit

WebFetch can't reach reddit.com: append `.json` to the URL and fetch it with a `User-Agent` header.
