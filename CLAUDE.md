# Claude Development Notes

## CI/CD

Push directly to main — don't create PRs or feature branches.

When e2e tests fail in CI, download the `playwright-report` artifact from the failed run to see screenshots and traces of what went wrong.

## Testing & Linting

Use test-driven development (TDD). When possible, write a failing test first, then write the code to make it pass.

All commands use turbo for parallelism and caching (~2s when cached):

```bash
npm test                    # run all tests across all packages
npx vitest run packages/core  # run tests for a single package
npm run lint                # lint all packages
npm run build:fast          # build all packages (type-check + bundle)
```

**Before pushing cross-package changes**, run lint to catch type errors in dependent packages (lint-staged only checks staged files):

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

## Example Translation

> Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much.

becomes:

> Mister. And Misiz. Derslee, uv number for, Praivat Draiv, wer proud tuu say dhat dhay wer perfaktlee normal, thangk yuu vairee much.
