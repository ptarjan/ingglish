import { loadDictionary, loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';

// Load all data before tests run in this worker
// With isolate: false, this is shared across all test files
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
