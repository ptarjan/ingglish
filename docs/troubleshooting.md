# Troubleshooting

Common problems and how to fix them.

## Build Issues

### Build Fails

**Symptoms:** `npm run build` exits with errors.

**Solutions:**
- Check that Node.js 20+ is installed (`node --version`)
- Run `npm ci` to get exact dependency versions
- Build all packages (turbo builds them in dependency order):
  ```bash
  npx turbo build:fast
  ```

### TypeScript Errors in Dependent Packages

**Symptoms:** After you change what `ingglish` exports, other packages fail with type errors.

**Cause:** The pre-commit hook lints only staged files, so a change to core's exports doesn't re-lint the packages that use them.

**Solution:** Run a full lint before pushing:
```bash
npx turbo lint
```

## Website Issues

### Blank Page

**Symptoms:** The website loads but shows nothing.

**Solutions:**
- Check the browser console for JavaScript errors
- Check that the dictionary chunk loaded (Network tab: look for `cmudict-*.js`)
- Check that the site's base path matches the URL it is deployed at

### Dictionary Not Loading

**Symptoms:** "Loading dictionary..." never finishes, or nothing gets translated.

**Solutions:**
- Check the Network tab for failed requests (4xx/5xx errors)
- If the assets are hosted on a different domain, check their CORS headers
- Check that `cmudict-*.js` and `word-frequencies-*.js` can be fetched

## Extension Issues

### Extension Not Working

**Symptoms:** The extension icon appears, but pages aren't translated.

**Solutions:**
- Check that `manifest.json` is valid JSON
- Check service worker console: `chrome://extensions` → find Ingglish → "Inspect views: service worker"
- Check that the content scripts have the right host permissions

### Pages Not Translating

**Symptoms:** The extension works on most pages but not on some.

**Cause:** Those pages block content scripts or use features the extension doesn't support.

**Known limitations:**
- Chrome Web Store and browser settings pages block all extensions
- Pages using Shadow DOM are not currently supported
- Some sites with a strict Content Security Policy (CSP) may block the extension

## Translation Issues

### Round-Trip Failures

**Symptoms:** A word doesn't survive a round trip: translating it English → Ingglish → English gives back a different word.

**Debug command:**
```bash
npm run debug:roundtrip -- <word>
```

This prints each step of the translation and highlights where the mismatch happens.

**Common causes:**

1. **Phoneme ambiguity**: the Ingglish spelling can be read as more than one sequence of sounds (shown here as ARPAbet phonemes):
   | Spelling | Could be | Example |
   |----------|----------|---------|
   | `sh` | SH (ship) or S+HH (exhume) | "ekshyoomd" |
   | `er` | ER (bird) or EH+R (welfare) | "welfer" |
   | `th` | TH (think) or T+HH (Thailand) | "tailand" |

   **Fix:** Add an alternative in `ARPABET_ALTERNATIVES` in `translate/reverse.ts`.

2. **Word not in dictionary**: the word isn't in the CMU Pronouncing Dictionary, so it is either left unchanged or translated with fallback rules that guess its pronunciation.

3. **Homophone selection**: several words share the pronunciation, and the reverse translator picks the most common one, using word frequency data.

### Adding Regression Tests

After fixing a translation bug, add a test so it can't come back:

```typescript
// In translate/reverse.test.ts
it('should round-trip "exhumed"', () => {
  const word = 'exhumed';
  const ingglish = translateWord(word);
  const results = reverseTranslateWord(ingglish);
  expect(results).toContain(word);
});
```