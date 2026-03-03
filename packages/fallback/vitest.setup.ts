import { beforeAll } from 'vitest';
import {
  CUSTOM_PRONUNCIATIONS,
  getDictionary,
  loadDictionary,
  loadFrequencies,
} from '@ingglish/dictionary';
import '@ingglish/ipa'; // registers 'ipa' format
import { setLangDict } from 'ingglish';
import 'ingglish'; // registers English word resolver + G2P

beforeAll(async () => {
  await Promise.all([loadDictionary(), loadFrequencies()]);
  // Build and cache English PhoneDict for translateSync()
  const entries = { ...getDictionary(), ...CUSTOM_PRONUNCIATIONS };
  setLangDict('en', { entries, lang: 'en' });
});
