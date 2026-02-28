import { beforeAll } from 'vitest';
import { loadDictionary, loadFrequencies } from '@ingglish/dictionary';
import '@ingglish/ipa'; // registers 'ipa' format

beforeAll(async () => {
  await Promise.all([loadDictionary(), loadFrequencies()]);
});
