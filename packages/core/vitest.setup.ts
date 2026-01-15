import { loadDictionary, loadReverseDictionary } from './src/dictionary';
import { loadFrequencies } from './src/utils/frequency';

// Load all data before tests run in this worker
// With isolate: false, this is shared across all test files
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
