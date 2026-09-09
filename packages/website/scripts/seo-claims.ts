/**
 * Claims a generated page's <title> and meta description must never make.
 *
 * The pages have a speechSynthesis button, not a recording: a snippet that
 * promises audio wins the click and loses the visit. Shared by the word-page
 * and rhyme-page tests so a new page family cannot quietly reintroduce it.
 */
export const AUDIO_CLAIM = /audio|listen|hear|sound clip|recording|play it/i;
