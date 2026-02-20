import { poems } from '../data/poems-data';

export const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different. English spelling is notoriously difficult to learn because it has so many exceptions. With phonetic spelling, words are written exactly as they sound - what you see is what you say!`;

export const SAMPLE_PASSAGES: { label: string; text: string }[] = [
  // === Existing samples ===
  {
    label: 'The quick brown fox',
    text: SAMPLE_TEXT,
  },
  {
    label: 'Hamlet soliloquy',
    text: `To be, or not to be, that is the question: Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them. To die, to sleep - no more; and by a sleep to say we end the heartache and the thousand natural shocks that flesh is heir to.`,
  },
  {
    label: 'The North Wind and the Sun',
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
    text: `Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense.`,
  },

  // === Famous speeches/documents ===
  {
    label: 'Gettysburg Address (opening)',
    text: `Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.`,
  },
  {
    label: '"I Have a Dream" excerpt',
    text: `I have a dream that one day this nation will rise up and live out the true meaning of its creed: "We hold these truths to be self-evident, that all men are created equal." I have a dream that one day on the red hills of Georgia, the sons of former slaves and the sons of former slave owners will be able to sit down together at the table of brotherhood.`,
  },
  {
    label: 'JFK inaugural excerpt',
    text: `And so, my fellow Americans: ask not what your country can do for you — ask what you can do for your country. My fellow citizens of the world: ask not what America will do for you, but what together we can do for the freedom of man.`,
  },
  {
    label: 'Declaration of Independence (opening)',
    text: `When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation.`,
  },

  // === Literature openings ===
  {
    label: 'Alice in Wonderland',
    text: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice, "without pictures or conversations?"`,
  },
  {
    label: 'Pride and Prejudice',
    text: `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.`,
  },
  {
    label: 'A Tale of Two Cities',
    text: `It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair.`,
  },
  {
    label: 'Moby Dick',
    text: `Call me Ishmael. Some years ago — never mind how long precisely — having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.`,
  },
  {
    label: '1984',
    text: `It was a bright cold day in April, and the clocks were striking thirteen. Winston Smith, his chin nuzzled into his breast in an effort to escape the vile wind, slipped quickly through the glass doors of Victory Mansions, though not quickly enough to prevent a swirl of gritty dust from entering along with him.`,
  },

  // === Spelling poems ===
  {
    label: 'Our Strange Lingo',
    text: poems.find((p) => p.title === 'Our Strange Lingo')!.lines.join('\n'),
  },
  {
    label: 'The Chaos (excerpt)',
    text: poems
      .find((p) => p.title === 'The Chaos')!
      .lines.slice(0, 20)
      .join('\n'),
  },
  {
    label: 'Why English Is So Hard',
    text: poems.find((p) => p.title === 'Why English Is So Hard')!.lines.join('\n'),
  },

  // === Everyday/mundane ===
  {
    label: 'Chocolate chip cookies recipe',
    text: `Preheat the oven to three hundred and seventy five degrees. Cream together one cup of butter with three quarters cup of sugar until light and fluffy. Beat in two eggs and one teaspoon of vanilla extract. In a separate bowl, whisk together two and a quarter cups of flour, one teaspoon of baking soda, and one teaspoon of salt. Gradually mix the dry ingredients into the wet mixture. Fold in two cups of chocolate chips. Drop rounded tablespoons onto ungreased baking sheets and bake for nine to eleven minutes until golden brown.`,
  },
  {
    label: 'Weather forecast',
    text: `Today will be mostly cloudy with a high near sixty eight degrees. There is a thirty percent chance of scattered showers throughout the afternoon. Winds will be from the southwest at ten to fifteen miles per hour. Tonight, expect partly cloudy skies with a low around fifty two degrees. Tomorrow looks much brighter, with sunshine returning and temperatures climbing into the mid seventies.`,
  },
  {
    label: 'Meeting email',
    text: `Hi everyone, just a quick reminder that our quarterly review meeting is scheduled for Thursday at two o'clock in the main conference room. Please bring your project updates and any questions you might have for the team. We'll be covering the budget for next quarter, the new client onboarding process, and the timeline for the website redesign. If you can't make it, please let me know and I'll send you the notes afterward. Thanks!`,
  },
  {
    label: 'Driving directions',
    text: `Head north on Main Street for about half a mile, then turn right onto Oak Avenue. Continue straight through two traffic lights. At the third light, take a left onto Highway Twenty Seven. Stay in the right lane and take the second exit at the roundabout. You'll see a large grocery store on your left — the office building is just past it on the right. There's a parking garage around the back with visitor spaces on the ground floor.`,
  },

  // === Science/educational ===
  {
    label: 'Photosynthesis',
    text: `Photosynthesis is the process by which green plants and certain other organisms transform light energy into chemical energy. During photosynthesis, plants capture light using chlorophyll, a green pigment found in their leaves. They use this energy to convert carbon dioxide from the air and water from the soil into glucose, a simple sugar that serves as food for the plant. Oxygen is released as a byproduct, which is essential for most life on Earth.`,
  },
  {
    label: 'The water cycle',
    text: `The water cycle describes the continuous movement of water on, above, and below the surface of the Earth. Water evaporates from oceans, lakes, and rivers when heated by the sun. This water vapor rises into the atmosphere where it cools and condenses into tiny droplets, forming clouds. When enough moisture gathers, precipitation falls as rain, snow, sleet, or hail. The water then flows into streams and rivers, eventually returning to the ocean, and the cycle begins again.`,
  },
];

export function pickRandomPassage(currentText: string): string {
  let pick;
  do {
    pick = SAMPLE_PASSAGES[Math.floor(Math.random() * SAMPLE_PASSAGES.length)];
  } while (SAMPLE_PASSAGES.length > 1 && pick.text === currentText);
  return pick.text;
}
