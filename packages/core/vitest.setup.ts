import {
  CUSTOM_PRONUNCIATIONS,
  getDictionary,
  loadDictionary,
  loadReverseDictionary,
  loadFrequencies,
} from '@ingglish/dictionary';
import '@ingglish/ipa'; // registers 'ipa' format
import './src/register-english'; // registers English word resolver + G2P + default loader
import { setLangDict } from './src/dict-loader';

// Load all data before tests run in this worker
// With isolate: false, this is shared across all test files
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);

// Build and cache the English PhoneDict so translateSync() works without await
const entries = { ...getDictionary(), ...CUSTOM_PRONUNCIATIONS };
setLangDict('en', { entries, lang: 'en' });
