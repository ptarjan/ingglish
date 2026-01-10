import { loadDictionary } from './src/dictionary';

// Load dictionary before tests run in this worker
await loadDictionary();
