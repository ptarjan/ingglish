import { loadDictionary } from './src/translator';

// Load dictionary before tests run in this worker
await loadDictionary();
