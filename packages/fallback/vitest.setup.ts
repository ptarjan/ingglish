import { beforeAll } from 'vitest';
import { loadDictionary, loadFrequencies } from '@ingglish/dictionary';

beforeAll(async () => {
  await Promise.all([loadDictionary(), loadFrequencies()]);
});
