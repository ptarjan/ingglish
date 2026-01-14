import { loadDictionary, loadReverseDictionary } from '@ingglish/core/internal';
import { loadFrequencies } from '@ingglish/core/internal';

// Pre-load dictionary before any tests run in this worker
// This avoids timeout issues in beforeAll hooks
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
