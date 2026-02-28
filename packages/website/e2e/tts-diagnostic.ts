/**
 * TTS Boundary Event Diagnostic
 *
 * Launches system Chrome (not Playwright's bundled Chromium, which has no TTS
 * voices) and measures real Web Speech API boundary event timing for multiple
 * languages. Reports:
 *   - Each boundary event with timestamp, charIndex, charLength
 *   - Interval stats (min/avg/max, events firing < 10ms apart)
 *   - Gap between last boundary and onend
 *   - Word coverage simulation using the same cumulative algorithm as useSpeech
 *
 * Requires: system Chrome installed, Playwright as a dev dependency.
 * Run with:  npx tsx packages/website/e2e/tts-diagnostic.ts
 */
import { chromium } from 'playwright';

interface BoundaryEvent {
  charIndex: number;
  charLength?: number;
  elapsed: number;
  name: string;
}

interface CoverageResult {
  firstHighlighted: number[];
  missed: number;
  shortestDuration: number;
  total: number;
  wordStarts: number[];
}

interface TTSResult {
  boundaries: BoundaryEvent[];
  endTime: number;
  text: string;
  voiceName: string;
}

const TESTS = [
  {
    label: 'Chinese',
    lang: 'zh',
    text: '满 纸 荒 唐 言 一 把 辛 酸 泪 都 云 作 者 痴 谁 解 其 中 味',
  },
  {
    label: 'Japanese',
    lang: 'ja',
    text: '国境 の 長い トンネル を 抜ける と 雪国 で あった 夜 の 底 が 白く なった 信号 所 に 汽車 が 止まった',
  },
  {
    label: 'Korean',
    lang: 'ko',
    text: '죽다 날 까지 하늘 을 우러르다 한 점 부끄럼 이 없다',
  },
  {
    label: 'English',
    lang: 'en',
    text: 'The quick brown fox jumps over the lazy dog',
  },
];

/** Simulate the cumulative highlighting algorithm from useSpeech. */
function checkCoverage(
  text: string,
  wordBoundaries: BoundaryEvent[],
  endTime: number
): CoverageResult {
  const WORD_RE = /[\p{L}\p{N}]/u;
  const segments = text.split(/(\s+)/);
  const wordStarts: number[] = [];
  let pos = 0;
  for (const seg of segments) {
    if (seg && !/^\s+$/.test(seg) && WORD_RE.test(seg)) {
      wordStarts.push(pos);
    }
    pos += seg.length;
  }

  const firstHighlighted = Array.from<number>({ length: wordStarts.length }).fill(-1);
  let maxEnd = -1;

  for (const b of wordBoundaries) {
    let wi = 0;
    for (let i = 1; i < wordStarts.length; i++) {
      if ((wordStarts[i] as number) <= b.charIndex) {
        wi = i;
      } else {
        break;
      }
    }

    let we = wi;
    if (b.charLength !== undefined && b.charLength > 1) {
      let rem = b.charLength - 1;
      let p = b.charIndex + 1;
      while (rem > 0 && p < text.length) {
        if (!/\s/.test(text[p] as string)) {
          rem--;
        }
        p++;
      }
      const charEnd = p - 1;
      for (let i = wi + 1; i < wordStarts.length; i++) {
        if ((wordStarts[i] as number) <= charEnd) {
          we = i;
        } else {
          break;
        }
      }
    }

    const prev = maxEnd;
    maxEnd = Math.max(maxEnd, we);
    for (let w = Math.max(0, prev + 1); w <= maxEnd; w++) {
      if (firstHighlighted[w] === -1) {
        firstHighlighted[w] = b.elapsed;
      }
    }
  }

  const missed = firstHighlighted.filter((t) => t === -1).length;
  const durations = firstHighlighted.filter((t) => t >= 0).map((t) => endTime - t);

  return {
    firstHighlighted,
    missed,
    shortestDuration: durations.length > 0 ? Math.min(...durations) : 0,
    total: wordStarts.length,
    wordStarts,
  };
}

async function main(): Promise<void> {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage();
  await page.goto('about:blank');

  // Wait for voices to load (Chrome loads them async)
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        if (speechSynthesis.getVoices().length > 0) {
          resolve();
          return;
        }
        speechSynthesis.addEventListener(
          'voiceschanged',
          () => {
            resolve();
          },
          { once: true }
        );
        setTimeout(resolve, 3000);
      })
  );

  // Get all voices grouped by language
  const allVoices = await page.evaluate(() =>
    speechSynthesis.getVoices().map((v) => ({ lang: v.lang, name: v.name }))
  );
  console.log(`${String(allVoices.length)} voices available\n`);

  for (const test of TESTS) {
    // Find all voices matching this language
    const voices = allVoices.filter(
      (v) => v.lang.startsWith(test.lang + '-') || v.lang.toLowerCase() === test.lang.toLowerCase()
    );
    // Skip Google voices (no boundary events)
    const testableVoices = voices.filter((v) => !v.name.startsWith('Google'));
    console.log(
      `=== ${test.label} (${String(testableVoices.length)} voices, ${String(voices.length - testableVoices.length)} Google skipped) ===`
    );

    for (const voice of testableVoices) {
      const result = await speakAndRecord(page, test.lang, test.text, voice.name);
      const wordBoundaries = result.boundaries.filter((b) => b.name === 'word');

      // Compact output per voice — only show details if there's a problem
      const coverage = checkCoverage(test.text, wordBoundaries, result.endTime);
      const deltas =
        wordBoundaries.length > 1
          ? wordBoundaries.map((b, i) =>
              i === 0 ? b.elapsed : b.elapsed - (wordBoundaries[i - 1] as BoundaryEvent).elapsed
            )
          : [];
      const under10 = deltas.filter((d) => d < 10).length;

      const status =
        coverage.missed > 0
          ? `FAIL: ${String(coverage.missed)}/${String(coverage.total)} words missed`
          : `OK: ${String(coverage.total)} words, shortest=${String(coverage.shortestDuration)}ms`;

      console.log(
        `  ${voice.name}: ${String(wordBoundaries.length)} events, ${String(under10)} batched, ${status}`
      );

      // Show full details for failing voices
      if (coverage.missed > 0 && wordBoundaries.length > 0) {
        printBoundaryEvents(result);
        printIntervalStats(wordBoundaries, result.endTime);
        printCoverageCheck(test.text, wordBoundaries, result.endTime);
      }
    }
    console.log();
  }

  await browser.close();
}

function printBoundaryEvents(result: TTSResult): void {
  let prevTime = 0;
  for (let i = 0; i < result.boundaries.length; i++) {
    const b = result.boundaries[i] as BoundaryEvent;
    const delta = b.elapsed - prevTime;
    const cl = b.charLength === undefined ? '' : ` cl=${String(b.charLength)}`;
    console.log(
      `  #${String(i)} t=${String(b.elapsed)}ms (+${String(delta)}ms) ci=${String(b.charIndex)}${cl} [${b.name}]`
    );
    prevTime = b.elapsed;
  }
}

/** Print detailed coverage results. */
function printCoverageCheck(text: string, wordBoundaries: BoundaryEvent[], endTime: number): void {
  const result = checkCoverage(text, wordBoundaries, endTime);

  console.log(`\n  Coverage (cumulative algorithm):`);
  console.log(`    ${String(result.total)} words, ${String(result.total - result.missed)} covered`);
  if (result.missed > 0) {
    console.log(`    *** ${String(result.missed)} WORDS NEVER HIGHLIGHTED ***`);
    result.firstHighlighted.forEach((t, i) => {
      if (t === -1) {
        console.log(`      Word ${String(i)} at pos ${String(result.wordStarts[i])}`);
      }
    });
  } else {
    console.log(`    All words highlighted`);
  }
  if (result.shortestDuration > 0) {
    console.log(`    Shortest highlight duration: ${String(result.shortestDuration)}ms`);
  }
}

function printIntervalStats(wordBoundaries: BoundaryEvent[], endTime: number): void {
  const lastBoundary = wordBoundaries.at(-1) as BoundaryEvent;
  const deltas = wordBoundaries.map((b, i) =>
    i === 0 ? b.elapsed : b.elapsed - (wordBoundaries[i - 1] as BoundaryEvent).elapsed
  );

  console.log(`\n  Timing:`);
  console.log(`    Last boundary → onend gap: ${String(endTime - lastBoundary.elapsed)}ms`);
  console.log(
    `    Word intervals: min=${String(Math.min(...deltas))}ms` +
      ` avg=${String(Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length))}ms` +
      ` max=${String(Math.max(...deltas))}ms`
  );
  console.log(
    `    Events < 10ms apart: ${String(deltas.filter((d) => d < 10).length)}/${String(deltas.length)}`
  );
}

async function speakAndRecord(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>,
  lang: string,
  text: string,
  voiceName?: string
): Promise<TTSResult> {
  // Use string evaluation to avoid tsx __name decorators breaking in browser context
  const js = `new Promise(resolve => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(${JSON.stringify(text)});
    u.lang = ${JSON.stringify(lang)};
    const voices = speechSynthesis.getVoices();
    const v = ${voiceName ? `voices.find(x => x.name === ${JSON.stringify(voiceName)})` : 'undefined'};
    if (v) u.voice = v;
    const bs = [];
    const t0 = performance.now();
    const r = () => resolve({ boundaries: bs, endTime: Math.round(performance.now() - t0), text: ${JSON.stringify(text)}, voiceName: v?.name ?? 'default' });
    u.onboundary = e => bs.push({ charIndex: e.charIndex, charLength: e.charLength, elapsed: Math.round(performance.now() - t0), name: e.name });
    u.onend = r;
    u.addEventListener('error', r);
    setTimeout(() => { speechSynthesis.cancel(); r(); }, 30000);
    speechSynthesis.speak(u);
  })`;
  return page.evaluate(js) as unknown as Promise<TTSResult>;
}

main().catch((error: unknown) => {
  console.error('Error:', error);
  process.exit(1);
});
