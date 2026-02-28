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

  const voiceCount = await page.evaluate(() => speechSynthesis.getVoices().length);
  console.log(`${String(voiceCount)} voices available\n`);

  for (const test of TESTS) {
    console.log(`=== ${test.label} ===`);

    const result = await speakAndRecord(page, test.lang, test.text);
    console.log(`Voice: ${result.voiceName}`);
    console.log(
      `${String(result.boundaries.length)} boundary events (speech: ${String(result.endTime)}ms):`
    );
    printBoundaryEvents(result);

    const wordBoundaries = result.boundaries.filter((b) => b.name === 'word');
    if (wordBoundaries.length > 0) {
      printIntervalStats(wordBoundaries, result.endTime);
      printCoverageCheck(test.text, wordBoundaries, result.endTime);
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

/** Simulate the cumulative highlighting algorithm from useSpeech and verify coverage. */
function printCoverageCheck(text: string, wordBoundaries: BoundaryEvent[], endTime: number): void {
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

  console.log(`\n  Coverage (cumulative algorithm):`);
  console.log(`    ${String(wordStarts.length)} words, ${String(maxEnd + 1)} covered`);
  if (missed > 0) {
    console.log(`    *** ${String(missed)} WORDS NEVER HIGHLIGHTED ***`);
    firstHighlighted.forEach((t, i) => {
      if (t === -1) {
        console.log(`      Word ${String(i)} at pos ${String(wordStarts[i])}`);
      }
    });
  } else {
    console.log(`    All words highlighted`);
  }
  if (durations.length > 0) {
    console.log(`    Shortest highlight duration: ${String(Math.min(...durations))}ms`);
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
  text: string
): Promise<TTSResult> {
  return page.evaluate(
    ({ lang, text }) => {
      return new Promise<TTSResult>((resolve) => {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Prefer non-Google voices (Google voices don't fire onboundary)
        const voices = speechSynthesis.getVoices();
        const matching = voices.filter(
          (v) => v.lang.startsWith(lang + '-') || v.lang.toLowerCase() === lang.toLowerCase()
        );
        const voice = matching.find((v) => !v.name.startsWith('Google')) ?? matching[0];
        if (voice) {
          utterance.voice = voice;
        }

        const boundaries: BoundaryEvent[] = [];
        const startTime = performance.now();
        const finish = (): void => {
          resolve({
            boundaries,
            endTime: Math.round(performance.now() - startTime),
            text,
            voiceName: voice?.name ?? 'default',
          });
        };

        utterance.onboundary = (event) => {
          boundaries.push({
            charIndex: event.charIndex,
            charLength: (event as unknown as { charLength?: number }).charLength,
            elapsed: Math.round(performance.now() - startTime),
            name: event.name,
          });
        };
        utterance.onend = finish;
        utterance.addEventListener('error', finish);
        setTimeout(() => {
          speechSynthesis.cancel();
          finish();
        }, 30_000);

        speechSynthesis.speak(utterance);
      });
    },
    { lang, text }
  );
}

main().catch((error: unknown) => {
  console.error('Error:', error);
  process.exit(1);
});
