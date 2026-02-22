declare module 'subtlex-word-frequencies' {
  interface WordFrequency {
    count: number;
    word: string;
  }
  const frequencies: WordFrequency[];
  export default frequencies;
}
