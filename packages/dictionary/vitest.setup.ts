import { beforeAll } from 'vitest';
import { loadDictionary } from './src/loader';
import { loadReverseDictionary } from './src/reverse';
import { loadFrequencies } from './src/frequency';

beforeAll(async () => {
  await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
});
