export const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different. English spelling is notoriously difficult to learn because it has so many exceptions. With phonetic spelling, words are written exactly as they sound - what you see is what you say!`;

export const SAMPLE_PASSAGES: { label: string; text: string }[] = [
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
];
