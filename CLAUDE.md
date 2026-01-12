# Claude Development Notes

## CI/CD

No need to build and test after every change - CI will handle that on push.

When e2e tests fail in CI, download the `playwright-report` artifact from the failed run to see screenshots and traces of what went wrong.

## Cross-Package Changes

This monorepo uses lint-staged for pre-commit hooks, which only lints staged files. When changing exports or interfaces in `@ingglish/core`, dependent packages (`dom`, `website`, `extension`) won't be automatically linted because they weren't modified.

**Before pushing changes that affect cross-package APIs**, run a full lint to catch breakages:

```bash
npm run lint
```

This catches type errors in dependent packages that lint-staged misses.

## Testing

Use test-driven development (TDD). When possible, write a failing test first, then write the code to make it pass.

## Code Comments

Add TODO comments in the code when a feature isn't complete. This helps track unfinished work.

## Performance

Profile before optimizing. Don't guess at performance solutions - measure first to identify actual bottlenecks.
