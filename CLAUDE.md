# Claude Development Notes

## CI/CD

No need to build and test after every change - CI will handle that on push.

Push directly to main — don't create PRs or feature branches.

When e2e tests fail in CI, download the `playwright-report` artifact from the failed run to see screenshots and traces of what went wrong.

## Cross-Package Changes

This monorepo uses lint-staged for pre-commit hooks, which only lints staged files. When changing exports or interfaces in `ingglish`, dependent packages (`dom`, `website`, `extension`) won't be automatically linted because they weren't modified.

**Before pushing changes that affect cross-package APIs**, run a full lint to catch breakages:

```bash
npm run lint
```

This catches type errors in dependent packages that lint-staged misses.

## Testing

Use test-driven development (TDD). When possible, write a failing test first, then write the code to make it pass.

Run all tests (parallelized via turbo, cached across runs):

```bash
npm test
```

Run tests for a single package:

```bash
npx vitest run packages/core
```

Run all linting (parallelized via turbo, cached across runs):

```bash
npm run lint
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
