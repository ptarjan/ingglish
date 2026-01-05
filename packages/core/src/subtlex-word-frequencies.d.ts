declare module 'subtlex-word-frequencies' {
  interface WordFrequency {
    word: string;
    count: number;
  }
  const frequencies: WordFrequency[];
  export default frequencies;
}
