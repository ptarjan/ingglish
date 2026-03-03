import {
  CUSTOM_PRONUNCIATIONS,
  getDictionary,
  loadDictionary,
  loadFrequencies,
  loadReverseDictionary,
} from '@ingglish/dictionary';
import { setLangDict } from 'ingglish'; // side-effect: registers English word resolver + G2P

// Pre-load dictionary before any tests run in this worker
// This avoids timeout issues in beforeAll hooks
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);

// Build and cache the English PhoneDict so translateSync() works without await
const entries = { ...getDictionary(), ...CUSTOM_PRONUNCIATIONS };
setLangDict('en', { entries, lang: 'en' });
