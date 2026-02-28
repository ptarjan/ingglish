import { poems } from '../poems-data';
import type { Sample } from './types';

export const en: Sample[] = [
  {
    label: 'The quick brown fox',
    text: `The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different. English spelling is notoriously difficult to learn because it has so many exceptions. With phonetic spelling, words are written exactly as they sound - what you see is what you say!`,
  },
  {
    label: 'Hamlet soliloquy',
    source: 'https://en.wikipedia.org/wiki/To_be,_or_not_to_be',
    text: `To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them. To die, to sleep - no more; and by a sleep to say we end the heartache and the thousand natural shocks that flesh is heir to.`,
  },
  {
    label: 'The North Wind and the Sun',
    source: 'https://en.wikipedia.org/wiki/The_North_Wind_and_the_Sun',
    text: `The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other.`,
  },
  {
    label: 'Tongue twisters',
    text: `She sells seashells by the seashore. The shells she sells are seashells, I'm sure. So if she sells seashells on the seashore, then I'm sure she sells seashore shells.

Peter Piper picked a peck of pickled peppers. A peck of pickled peppers Peter Piper picked.`,
  },
  {
    label: 'English spelling absurdities',
    text: `Though through thorough thought, I ought to understand the cough brought on by the dough. The rough bough of a plough can cause hiccoughs. A knight might write about the right way to knit, but the psychology of a gnome is a subtle thing.`,
  },
  {
    label: 'Harry Potter',
    source: 'https://en.wikipedia.org/wiki/Harry_Potter_and_the_Philosopher%27s_Stone',
    text: `Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.`,
  },
  {
    label: 'Gettysburg Address',
    source: 'https://www.archives.gov/exhibits/featured-documents/gettysburg-address',
    text: `Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.`,
  },
  {
    label: '"I Have a Dream"',
    source: 'https://en.wikipedia.org/wiki/I_Have_a_Dream',
    text: `I have a dream that one day this nation will rise up and live out the true meaning of its creed: "We hold these truths to be self-evident, that all men are created equal." I have a dream that one day on the red hills of Georgia, the sons of former slaves and the sons of former slave owners will be able to sit down together at the table of brotherhood.`,
  },
  {
    label: 'JFK inaugural',
    source: 'https://en.wikipedia.org/wiki/Inaugural_address_of_John_F._Kennedy',
    text: `And so, my fellow Americans: ask not what your country can do for you — ask what you can do for your country. My fellow citizens of the world: ask not what America will do for you, but what together we can do for the freedom of man.`,
  },
  {
    label: 'Declaration of Independence',
    source: 'https://www.archives.gov/founding-docs/declaration-transcript',
    text: `When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.`,
  },
  {
    label: 'Alice in Wonderland',
    source: 'https://www.gutenberg.org/cache/epub/11/pg11-images.html',
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"`,
  },
  {
    label: 'Pride and Prejudice',
    source: 'https://www.gutenberg.org/cache/epub/1342/pg1342-images.html',
    text: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.`,
  },
  {
    label: 'A Tale of Two Cities',
    source: 'https://www.gutenberg.org/cache/epub/98/pg98-images.html',
    text: `It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.`,
  },
  {
    label: 'Moby Dick',
    source: 'https://www.gutenberg.org/cache/epub/2701/pg2701-images.html',
    text: `Call me Ishmael. Some years ago — never mind how long precisely — having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.`,
  },
  {
    label: '1984',
    source: 'https://en.wikipedia.org/wiki/Nineteen_Eighty-Four',
    text: `It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.`,
  },
  {
    label: 'Our Strange Lingo',
    text: poems.find((p) => p.title === 'Our Strange Lingo')!.lines.join('\n'),
  },
  {
    label: 'The Chaos (excerpt)',
    source: 'https://en.wikipedia.org/wiki/The_Chaos',
    text: poems
      .find((p) => p.title === 'The Chaos')!
      .lines.slice(0, 20)
      .join('\n'),
  },
  {
    label: 'Why English Is So Hard',
    text: poems.find((p) => p.title === 'Why English Is So Hard')!.lines.join('\n'),
  },
  {
    label: 'The Great Gatsby',
    source: 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
    text: `In my younger and more vulnerable years my father gave me some advice that I've been turning over in my mind ever since. "Whenever you feel like criticizing anyone," he told me, "just remember that all the people in this world haven't had the advantages that you've had."`,
  },
  {
    label: 'The Hobbit',
    source: 'https://en.wikipedia.org/wiki/The_Hobbit',
    text: `In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat: it was a hobbit-hole, and that means comfort.`,
  },
  {
    label: 'Jane Eyre',
    source: 'https://www.gutenberg.org/cache/epub/1260/pg1260-images.html',
    text: `There was no possibility of taking a walk that day. We had been wandering, indeed, in the leafless shrubbery an hour in the morning; but since dinner the cold winter wind had brought with it clouds so sombre, and a rain so penetrating, that further outdoor exercise was now out of the question.`,
  },
  {
    label: 'The Raven (Poe)',
    source: 'https://www.gutenberg.org/cache/epub/17192/pg17192-images.html',
    text: `Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint and curious volume of forgotten lore — while I nodded, nearly napping, suddenly there came a tapping, as of someone gently rapping, rapping at my chamber door. "'Tis some visitor," I muttered, "tapping at my chamber door — only this and nothing more."`,
  },
  {
    label: 'Frankenstein',
    source: 'https://www.gutenberg.org/cache/epub/84/pg84-images.html',
    text: `You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.`,
  },
  {
    label: 'Churchill — We shall fight on the beaches',
    source: 'https://en.wikipedia.org/wiki/We_shall_fight_on_the_beaches',
    text: `We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets, we shall fight in the hills; we shall never surrender. Even though large tracts of Europe and many old and famous States have fallen or may fall into the grip of the Gestapo and all the odious apparatus of Nazi rule, we shall not flag or fail.`,
  },
  {
    label: 'The Road Not Taken (Frost)',
    source: 'https://en.wikipedia.org/wiki/The_Road_Not_Taken',
    text: `Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could to where it bent in the undergrowth. Then took the other, as just as fair, and having perhaps the better claim, because it was grassy and wanted wear.`,
  },
  {
    label: 'Catch-22',
    source: 'https://en.wikipedia.org/wiki/Catch-22',
    text: `It was love at first sight. The first time Yossarian saw the chaplain he fell madly in love with him. Yossarian was in the hospital with a pain in his liver that fell just short of being jaundice. The doctors were puzzled by the fact that it wasn't quite jaundice.`,
  },
];
