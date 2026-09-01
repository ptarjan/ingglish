import type { JSX } from 'react';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { RouteObject } from 'react-router';
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
  useParams,
} from 'react-router';
import AppLayout from './AppLayout';
import Docs from './components/Docs';
import ErrorBoundary from './components/ErrorBoundary';
import Extension from './components/Extension';
import SpellingGuide from './components/SpellingGuide';
import { FormatProvider } from './contexts/FormatContext';
import type { GameId } from './routes';
import { GAME_ENTRIES, sitePath } from './routes';

// Noscript fallback for dict-dependent pages (spinner hidden by noscript CSS in index.html)
const dictFallback = (
  <noscript
    dangerouslySetInnerHTML={{
      __html:
        '<p style="color:var(--color-text-muted,#64748b);padding:2rem;text-align:center">This page requires JavaScript for interactive features.</p>',
    }}
  />
);

// Every route below is backed by a component that needs the dictionary, which
// doesn't exist at build time, so each one used to pre-render as a bare spinner
// — a page with no indexable text on it. main.tsx mounts with createRoot rather
// than hydrateRoot, so this markup owes the client tree no parity: the browser
// throws all of it away on mount. It exists to describe the route to a crawler,
// and to a reader with JavaScript off.
function SeoPage({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <>
      <div className="seo-content" style={{ margin: '0 auto', maxWidth: '48rem', padding: '2rem' }}>
        {children}
      </div>
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
      {dictFallback}
    </>
  );
}

const homeContent = (
  <SeoPage>
    <h2>English spelled the way it sounds</h2>
    <p>
      Ingglish gives every English sound exactly one spelling. Take <em>ough</em>: English reads the
      same four letters six different ways, in <em>through</em>, <em>though</em>, <em>thought</em>,{' '}
      <em>tough</em>, <em>cough</em> and <em>bough</em>. Ingglish writes those as <em>throo</em>,{' '}
      <em>thoh</em>, <em>thawt</em>, <em>tuhf</em>, <em>cof</em> and <em>bow</em> — six sounds, six
      spellings, nothing left to guess at.
    </p>
    <p>
      This page is a scrolling tour of the idea: the silent letters that simply go away, <em>ph</em>{' '}
      turning into <em>f</em>, <em>c</em> picking a lane between <em>k</em> and <em>s</em>, an
      ordinary paragraph rewritten one rule at a time, and a passage of Hamlet you can read in
      Ingglish without having studied anything first. It closes with &ldquo;Hints on Pronunciation
      for Foreigners&rdquo;, the 1954 poem about how little English spelling can be trusted,
      translated line by line.
    </p>
    <nav>
      <ul>
        <li>
          <a href={sitePath('text')}>Text Translator</a> — paste English, read it back phonetically
        </li>
        <li>
          <a href={sitePath('url')}>URL Translator</a> — any web page, respelled in place
        </li>
        <li>
          <a href={sitePath('guide')}>Spelling Guide</a> — the full sound-to-spelling table
        </li>
        <li>
          <a href={sitePath('explore')}>Word Explorer</a> — one word, phoneme by phoneme
        </li>
        <li>
          <a href={sitePath('games')}>Games</a> — eleven ways to practise
        </li>
        <li>
          <a href={sitePath('experiment')}>Experiment</a> — build a rival spelling system
        </li>
        <li>
          <a href={sitePath('extension')}>Bookmarklet &amp; Extension</a> — translate as you browse
        </li>
        <li>
          <a href={sitePath('docs')}>Documentation</a> — the design, the data, the arguments
        </li>
      </ul>
    </nav>
  </SeoPage>
);

const textContent = (
  <SeoPage>
    <h2>Ingglish Text Translator</h2>
    <p>
      Two panes, both editable. Type English on the left and it appears in Ingglish on the right as
      you go; type Ingglish on the right and it turns back into English. Hovering a word highlights
      the matching word in the other pane, so it is always obvious which spelling became which, and
      words the dictionary didn&rsquo;t know are marked so you can see where the rules had to guess.
    </p>
    <p>
      The right-hand pane will also render the same text as a plain pronunciation guide, as IPA, or
      in the Shavian and Deseret alphabets. The left-hand pane accepts 23 source languages —
      Spanish, French, German, Japanese, Mandarin, Cantonese, Korean, Arabic, Persian, Vietnamese,
      Esperanto and more — each with sample passages, a read-aloud button where the browser has a
      voice for it, and a Share button that packs the text into the URL. See the{' '}
      <a href={sitePath('guide')}>spelling guide</a> for the rules behind the output, or{' '}
      <a href={sitePath('explore')}>the word explorer</a> to take a single word apart.
    </p>
  </SeoPage>
);

const urlContent = (
  <SeoPage>
    <h2>Read a whole web page in Ingglish</h2>
    <p>
      Paste a link and the page comes back looking like itself — same layout, same images, same
      styling — with every word respelled phonetically. Hovering a translated word shows you the
      original English, and links inside the page are re-translated rather than followed away, so
      you can read a whole site this way instead of one page of it. Headings, buttons, alt text and
      tooltips are translated too.
    </p>
    <p>
      Example pages are one click from the box: Wikipedia, the US Constitution, Alice in Wonderland,
      Hacker News, NPR, Reddit, GitHub. The same 23 source languages and the same output alphabets
      as the <a href={sitePath('text')}>text translator</a> apply here. Pages are fetched through a
      CORS proxy and stripped of their scripts before anything is rendered, which keeps it safe and
      means a site that forbids embedding will refuse to appear. For everyday browsing the{' '}
      <a href={sitePath('extension')}>bookmarklet or browser extension</a> does the same job in
      place, on the real page.
    </p>
  </SeoPage>
);

const exploreContent = (
  <SeoPage>
    <h2>Take a single word apart</h2>
    <p>
      Search any English word and the explorer shows how its spelling is derived: one row per sound,
      each with its ARPAbet symbol, its IPA symbol, the letters Ingglish uses to write it, and
      whether it is a vowel or a consonant. The header carries the whole word in IPA and a badge
      naming the source of the pronunciation — the CMU dictionary, a hand-written override, or the
      fallback that had to be used.
    </p>
    <p>
      When there is no dictionary entry the fallback is shown at work: the letter-to-sound rules
      that guessed it, the two halves of a compound, the prefix and stem of an inflected form, the
      letters of an initialism, or the American spelling behind a British one. Underneath sits every
      other word with the identical pronunciation, as clickable chips with their own spellings and
      corpus counts — the homophones that phonetic spelling merges and English keeps apart. Try
      words like <em>colonel</em>, <em>favourable</em> or <em>doomscroll</em>, or read about the{' '}
      <a href={sitePath('docs/false-friends')}>words English spells misleadingly</a>.
    </p>
  </SeoPage>
);

const experimentContent = (
  <SeoPage>
    <h2>Design your own spelling system</h2>
    <p>
      Ingglish is one answer to the question, not the only one. This page hands you the entire
      phoneme table — every vowel and consonant, with its IPA symbol, its default spelling and
      example words — and lets you respell any of them. Sample text below re-renders as you type,
      flagging each word whose spelling now differs from standard Ingglish, and a warning appears
      the moment two sounds end up claiming the same letters.
    </p>
    <p>
      After every edit the page re-scores your alphabet against the whole dictionary and puts the
      numbers beside Ingglish&rsquo;s: how much text is preserved unchanged, how much of it is
      unambiguous, how pronounceable it is, how far each word has moved, how familiar the letter
      patterns look, and how natural the letter sequences are. It also lists the most common words
      your changes affect and any new collisions you have introduced. Presets load the conventions
      of thirteen languages (Spanish, Finnish, Turkish, Welsh, Korean and others), three alphabets
      (IPA, Shavian, Deseret) and four historical reform proposals including SoundSpel and Nue
      Speling. Your mapping lives in the URL, so sharing it is a link, and it becomes a selectable
      output format on the <a href={sitePath('text')}>text translator</a>. Background reading:{' '}
      <a href={sitePath('docs/spelling-reform-comparison')}>
        every major reform attempt and why it failed
      </a>
      .
    </p>
  </SeoPage>
);

interface GameCopy {
  /** One line for the hub listing. */
  blurb: string;
  body: JSX.Element;
  /** Heading on the game's own page — the name the game calls itself. */
  heading: string;
}

const GAME_COPY: Record<GameId, GameCopy> = {
  daily: {
    blurb:
      'A Wordle in Ingglish — guess the five-letter word in six tries. Same word for everyone, new one each day.',
    body: (
      <>
        <p>
          Guess the five-letter Ingglish word in six tries. Green means the right letter in the
          right place, yellow means it is in the word somewhere else, grey rules it out. The
          on-screen keyboard has no q and no x on it, because Ingglish spelling never needs either —
          c survives only inside <em>ch</em>.
        </p>
        <p>
          The answer is drawn from the most common English words whose Ingglish spelling is exactly
          five letters and differs from the English one, chosen by today&rsquo;s date, so everyone
          in the world is solving the same puzzle. It rolls over at midnight UTC with a countdown on
          the results screen, your board survives a refresh, a day streak is kept, and finishing
          gives you the usual block of coloured squares to paste wherever you like.
        </p>
      </>
    ),
    heading: 'Ingglish Wordle',
  },
  homophones: {
    blurb:
      'One Ingglish spelling, four English words — pick the one it stands for. Ten rounds of merged spellings.',
    body: (
      <>
        <p>
          Once spelling follows sound, words English keeps apart collapse into one, and this quiz
          asks you to pull them back apart. You are shown a single Ingglish spelling and four
          English words, and you choose the one it stands for. Where several English words share the
          spelling, any of them counts, and the answer names the whole set.
        </p>
        <p>
          Ten rounds per game, drawn from 63 groups of English homophones and near-homophones, three
          easy, four medium and three hard, in that order. The wrong answers are chosen to be close
          — usually a single vowel away — so recognising the shape of the word will not save you.
          The <a href={sitePath('explore')}>word explorer</a> lists the homophones of any word if
          you want to study before playing.
        </p>
      </>
    ),
    heading: 'Ingglish Homophones Quiz',
  },
  learn: {
    blurb:
      'Eight lessons, one rule at a time, from unchanged words up to full sentences. Progress is saved.',
    body: (
      <>
        <p>
          Eight short lessons, taken in any order, nothing locked. They start with the thousands of
          English words Ingglish leaves completely unchanged, then take on silent letters, vowels
          that stay consistent, <em>ph</em> becoming <em>f</em>, <em>c</em> splitting into{' '}
          <em>k</em> and <em>s</em>, the common letter patterns, the split between <em>th</em> and{' '}
          <em>dh</em>, and finally whole sentences.
        </p>
        <p>
          Each lesson explains its rule with five worked English-to-Ingglish pairs and then asks
          five questions where you type the English word behind an Ingglish spelling. Your best
          score per lesson is kept in the browser, so the menu shows what you have finished and how
          well. This is the gentlest way in; the <a href={sitePath('guide')}>spelling guide</a> is
          the reference version of the same material.
        </p>
      </>
    ),
    heading: 'Learn to Read Ingglish',
  },
  'origin-detective': {
    blurb:
      'Guess whether a strangely spelled word came from Germanic, French, Latin or Greek. The spelling is the clue.',
    body: (
      <>
        <p>
          Strange English spellings are usually loanwords still wearing their old country&rsquo;s
          clothes. <em>Ph</em> and <em>rh</em> point at Greek; a <em>ch</em> pronounced <em>sh</em>,
          or an <em>-eur</em> ending, at French; a silent <em>k</em> or <em>gh</em> at the Germanic
          core. You get a word and one clue about its spelling, and you name the source: Germanic,
          French, Latin or Greek.
        </p>
        <p>
          Twenty-four words in the pool, six from each language, ten per game, easy clues first and
          the surprises last. Every answer opens up the etymology behind it, which is the actual
          point — English spelling is irregular because it is four languages in a trench coat.
          Finish and the results screen reads &ldquo;Case Closed!&rdquo;. See also{' '}
          <a href={sitePath('docs/how-to-read-english')}>the rules for reading English aloud</a>.
        </p>
      </>
    ),
    heading: 'Origin Detective',
  },
  'pattern-sort': {
    blurb:
      'Words arrive one at a time — sort each into the right pronunciation bucket for its letter pattern.',
    body: (
      <>
        <p>
          Four letter patterns, two pronunciations each: <em>ea</em> as in <em>feet</em> or as in{' '}
          <em>bed</em>, <em>ow</em> as in <em>ouch</em> or as in <em>go</em>, <em>oo</em> as in pool
          or as in look, <em>ou</em> as in <em>ouch</em> or as in <em>cup</em>. Words arrive one at
          a time and you put each into the bucket that matches how it actually sounds. It is two
          buttons — tap them or use the number keys — not drag and drop.
        </p>
        <p>
          A game is three rounds of eight words, three of the four patterns per game, with the
          correct bucket named immediately after each word. The results break your score down by
          pattern, which is the useful part: almost everyone is fine on one pattern and quietly
          terrible on another.
        </p>
      </>
    ),
    heading: 'Pattern Sort',
  },
  reading: {
    blurb:
      'Read ten Ingglish sentences against the clock and type the English. Scored word by word.',
    body: (
      <>
        <p>
          Ten sentences appear in Ingglish, one at a time, and you type what they say in English.
          Each round is timed — 30 seconds for the easy ones, 25 in the middle, 20 for the hardest —
          and the clock turns red for the last five seconds. When it runs out the round is scored
          with whatever you had typed.
        </p>
        <p>
          Scoring is per word rather than per sentence. The exact word counts, so does the English
          word that Ingglish spelling reverses to, and a typo within a letter or two still earns
          credit, because the test is whether you read it, not whether you type well. Afterwards
          every word is coloured against the expected answer and the score card can be copied as an
          image. New here? Start with <a href={sitePath('games/learn')}>the eight lessons</a>{' '}
          instead.
        </p>
      </>
    ),
    heading: 'Ingglish Reading Challenge',
  },
  reverse: {
    blurb:
      'The other direction: see an English word, type the Ingglish spelling. Partial credit for near misses.',
    body: (
      <>
        <p>
          The reading challenge turned around. You are given an English word and you write it the
          way Ingglish would — ten words, easy to hard, each on a countdown of 30, 25 or 20 seconds
          depending on difficulty.
        </p>
        <p>
          Answers take partial credit: a perfect spelling scores full marks and one within a letter
          or two scores half, because what is being tested is whether you heard the sounds in the
          word, not whether you have memorised a dictionary. The review screen puts your spelling
          next to the correct one for all ten rounds. If you want the rules in front of you first,
          the <a href={sitePath('guide')}>spelling guide</a> is the whole table.
        </p>
      </>
    ),
    heading: 'Ingglish Reverse Spelling',
  },
  'rule-or-exception': {
    blurb: 'A spelling rule and a word: does the word follow the rule or break it?',
    body: (
      <>
        <p>
          A spelling rule is stated — silent E makes the vowel say its name, C sounds like S before
          E, I or Y, a double consonant keeps the vowel short — and one English word is put beside
          it. Two buttons, and the only question is whether that word follows the rule, or breaks
          it.
        </p>
        <p>
          Ten words per game from a pool of forty, running from the obvious to the genuinely
          arguable, with an explanation after each. It is the quickest demonstration of how thin
          most English spelling rules are once you start testing them against real vocabulary — the{' '}
          <a href={sitePath('docs/orthographic-transparency')}>transparency writeup</a> is the long
          version of the same point.
        </p>
      </>
    ),
    heading: 'Rule or Exception?',
  },
  speedmatch: {
    blurb:
      'Match Ingglish words to their English pairs against a stopwatch. Three rounds, best time saved.',
    body: (
      <>
        <p>
          Two columns of six words, Ingglish on the left and English on the right, and a stopwatch
          that starts when you do. Click one word from each side to pair them: a correct pair locks
          in place, a wrong one shakes and the clock keeps running. There is no time limit — the
          time itself is the score.
        </p>
        <p>
          Three rounds of six pairs. Common words first, trickier spellings second, and last a
          cluster of near misses — lake, like, look, luck, lock, or mate, mite, moat, mute — where
          everything differs by one vowel and reading carefully is the entire game. Your best total
          time is stored in the browser and the results screen tells you when you have beaten it.
        </p>
      </>
    ),
    heading: 'Ingglish Speed Match',
  },
  'spell-that-sound': {
    blurb: 'A sound and a word with a hole in it — choose the spelling that fills the blank.',
    body: (
      <>
        <p>
          English gives most sounds several possible spellings and no dependable way to choose
          between them. Here you are given a sound — the long &ldquo;ay&rdquo;, the long
          &ldquo;ee&rdquo;, a plain &ldquo;k&rdquo; or &ldquo;f&rdquo;, the &ldquo;shun&rdquo;
          ending — and a word with a gap in it, and you pick the spelling that belongs in that
          particular word.
        </p>
        <p>
          Each option is drawn as the finished word rather than a bare cluster of letters, so you
          judge it the way you would while reading rather than as a puzzle. Ten questions, an
          explanation after every one, and the blank fills itself in once you have answered.
          Ingglish&rsquo;s answer to all of this is to give each sound exactly one spelling; see{' '}
          <a href={sitePath('docs/how-to-spell-english')}>how English chooses instead</a>.
        </p>
      </>
    ),
    heading: 'Spell That Sound',
  },
  'spelling-rules': {
    blurb:
      'A letter pattern is highlighted in an English word — pick the sound it makes there. Explanations included.',
    body: (
      <>
        <p>
          This one is about English, not Ingglish. A word appears with a single spelling pattern
          highlighted — <em>ea</em>, <em>ch</em>, <em>gh</em>, a split <em>a_e</em> straddling the
          consonant — and you choose which sound that pattern makes in that particular word.
        </p>
        <p>
          Ten questions per game from a bank of 65, ordered easy to hard, and every answer comes
          with a written explanation of the rule involved. Play a few rounds and the argument makes
          itself: the same letters keep changing their minds, and the only way to know is to have
          already met the word. The <a href={sitePath('docs/metrics')}>metrics page</a> puts a
          number on how often that happens.
        </p>
      </>
    ),
    heading: 'English Spelling Rule Quiz',
  },
};

const GAME_SECTIONS: { ids: GameId[]; intro: string; title: string }[] = [
  {
    ids: ['reading', 'homophones', 'learn', 'daily', 'speedmatch', 'reverse'],
    intro: 'Practice reading and writing Ingglish.',
    title: 'Ingglish',
  },
  {
    ids: [
      'spelling-rules',
      'spell-that-sound',
      'rule-or-exception',
      'pattern-sort',
      'origin-detective',
    ],
    intro: 'Learn why English is spelled the way it is.',
    title: 'English Spelling',
  },
];

const gamesHubContent = (
  <SeoPage>
    <h2>Ingglish Games</h2>
    <p>
      Eleven browser games, no account and no download. Six of them drill reading and writing
      Ingglish, from a first lesson through to a daily puzzle. The other five are about English
      spelling itself — which sound a letter pattern is making, which spelling a sound takes, and
      why the answer so often depends on where the word was borrowed from.
    </p>
    {GAME_SECTIONS.map((section) => (
      <div key={section.title}>
        <h3>{section.title}</h3>
        <p>{section.intro}</p>
        <ul>
          {section.ids.map((id) => (
            <li key={id}>
              <a href={sitePath(`games/${id}`)}>{GAME_COPY[id].heading}</a> — {GAME_COPY[id].blurb}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </SeoPage>
);

function GamePage(): JSX.Element {
  const { gameId } = useParams<{ gameId?: string }>();
  const copy = GAME_ENTRIES.some((g) => g.id === gameId) ? GAME_COPY[gameId as GameId] : undefined;
  if (copy === undefined) {
    return gamesHubContent;
  }
  return (
    <SeoPage>
      <h2>{copy.heading}</h2>
      {copy.body}
      <p>
        <a href={sitePath('games')}>All Ingglish games</a>
      </p>
    </SeoPage>
  );
}

const challengeContent = (
  <SeoPage>
    <h2>The reading challenge has moved</h2>
    <p>
      The Ingglish reading challenge used to live at this address. It is now at{' '}
      <a href={sitePath('games/reading')}>/games/reading/</a>, alongside the ten other games, and
      your browser is being sent there now.
    </p>
    <p>
      Nothing about the challenge changed in the move: ten Ingglish sentences, a countdown per
      round, and word-by-word scoring. The rest of the collection is at{' '}
      <a href={sitePath('games')}>the games hub</a>.
    </p>
  </SeoPage>
);

// SSG-specific route config: eagerly import dict-independent components (Docs, Extension, SpellingGuide)
// so they render their full content. Dict-dependent routes render static prose plus a noscript
// fallback, since the dictionary isn't available at build time.
const ssgRoutes: RouteObject[] = [
  {
    children: [
      {
        element: homeContent,
        index: true,
      },
      {
        element: textContent,
        path: 'text',
      },
      {
        element: urlContent,
        path: 'url',
      },
      {
        element: <SpellingGuide />,
        path: 'guide',
      },
      {
        element: <Extension />,
        path: 'extension',
      },
      {
        element: exploreContent,
        path: 'explore',
      },
      {
        element: experimentContent,
        path: 'experiment',
      },
      {
        element: (
          <ErrorBoundary>
            <Docs />
          </ErrorBoundary>
        ),
        path: 'docs/:docId?',
      },
      {
        element: <GamePage />,
        path: 'games/:gameId?',
      },
      {
        // /challenge redirects to /games/reading on the client; SSG says so in prose
        element: challengeContent,
        path: 'challenge',
      },
    ],
    element: <AppLayout />,
  },
];

// AppLayout and Docs render <meta name="description"> and <link rel="canonical">
// into the tree because React 19 hoists them into <head> in the browser.
// renderToString does not hoist, so on the server they stay where they were
// rendered — inside #root — and the page ends up with two or three conflicting
// descriptions, none of them in <head>. The <head> copies written by
// customizeHtml in vite.config.ts are the only ones that count, so drop these.
// React writes attributes in its own order, so match on the identifying
// attribute rather than on the start of the tag.
const HEAD_ONLY_TAGS = /<meta [^>]*name="description"[^>]*>|<link [^>]*rel="canonical"[^>]*>/g;

export async function render(url: string): Promise<string> {
  const handler = createStaticHandler(ssgRoutes);
  const fetchRequest = new Request(`https://ingglish.com${url}`);
  const context = await handler.query(fetchRequest);

  // Redirects return a Response
  if (context instanceof Response) {
    return '';
  }

  const router = createStaticRouter(handler.dataRoutes, context);
  const html = renderToString(
    <React.StrictMode>
      <FormatProvider>
        <StaticRouterProvider context={context} router={router} />
      </FormatProvider>
    </React.StrictMode>
  );
  return html.replaceAll(HEAD_ONLY_TAGS, '');
}
