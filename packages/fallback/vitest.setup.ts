import { beforeAll } from 'vitest';
import { loadDictionary, loadFrequencies } from '@ingglish/dictionary';
import { registerIPA } from '@ingglish/ipa';

registerIPA();

beforeAll(async () => {
  await Promise.all([loadDictionary(), loadFrequencies()]);
});
