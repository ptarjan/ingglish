import { loadDictionary, loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';

// Pre-load dictionary before any tests run in this worker
// This avoids timeout issues in beforeAll hooks
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
