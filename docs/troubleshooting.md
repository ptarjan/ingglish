# Troubleshooting

Common issues and how to fix them.

## Build Issues

### Build Fails

**Symptoms:** `npm run build` exits with errors.

**Solutions:**
- Ensure Node.js 20+ is installed (`node --version`)
- Run `npm ci` to get exact dependency versions
- Build all packages (turbo handles dependency order automatically):
  ```bash
  npx turbo build:fast
  ```

### TypeScript Errors in Dependent Packages

**Symptoms:** After changing exports in `ingglish`, you get type errors in other packages.

**Cause:** Pre-commit hooks only lint staged files. Changes to core's exports won't trigger linting of dependent packages.

**Solution:** Run a full lint before pushing:
```bash
npx turbo lint
```

## Website Issues

### Blank Page

**Symptoms:** The website loads but shows nothing.

**Solutions:**
- Check browser console for JavaScript errors
- Verify the dictionary chunk loaded (Network tab → look for `cmudict-*.js`)
- Check that the base path matches your deployment URL

### Dictionary Not Loading

**Symptoms:** "Loading dictionary..." never completes, or translation doesn't work.

**Solutions:**
- Check Network tab for failed requests (4xx/5xx errors)
- Verify CORS headers if hosting assets on a different domain
- Check that `cmudict-*.js` and `word-frequencies-*.js` are accessible

## Extension Issues

### Extension Not Working

**Symptoms:** Extension icon appears but pages aren't translated.

**Solutions:**
- Verify `manifest.json` is valid JSON
- Check service worker console: `chrome://extensions` → find Ingglish → "Inspect views: service worker"
- Ensure content scripts have correct host permissions

### Pages Not Translating

**Symptoms:** Some specific pages don't translate.

**Cause:** Certain pages block content scripts or use unsupported features.

**Known limitations:**
- Chrome Web Store and browser settings pages block all extensions
- Pages using Shadow DOM are not currently supported
- Some sites with strict CSP may block the extension

## Translation Issues

### Round-Trip Failures

**Symptoms:** A word doesn't survive round-trip translation (English → Ingglish → English returns a different word).

**Debug command:**
```bash
npm run debug:roundtrip -w ingglish <word>
```

This shows the translation pipeline step-by-step, highlighting where mismatches occur.

**Common causes:**

1. **Phoneme ambiguity** - The Ingglish spelling can be parsed multiple ways:
   | Spelling | Could be | Example |
   |----------|----------|---------|
   | `sh` | SH (ship) or S+HH (exhume) | "ekshyoomd" |
   | `er` | ER (bird) or EH+R (welfare) | "welfer" |
   | `th` | TH (think) or T+HH (Thailand) | "tailand" |

   **Fix:** Add an alternative in `ARPABET_ALTERNATIVES` in `translate/reverse.ts`.

2. **Word not in dictionary** - The word isn't in CMU Pronouncing Dictionary. It will pass through unchanged or use fallback heuristics.

3. **Homophone selection** - Multiple words share the same pronunciation. The reverse translator picks the most common one based on word frequency data.

### Adding Regression Tests

After fixing a translation issue, add a test to prevent regression:

```typescript
// In translate/reverse.test.ts
it('should round-trip "exhumed"', () => {
  const word = 'exhumed';
  const ingglish = translateWord(word);
  const results = reverseTranslateWord(ingglish);
  expect(results).toContain(word);
});
```

## See Also

- [Architecture](architecture.md) - How the translation pipeline works
- [Phoneme Mapping](phoneme-mapping.md) - ARPAbet to Ingglish/IPA tables
- [Performance](performance.md) - Profiling and optimization
