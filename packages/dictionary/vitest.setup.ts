import { loadDictionary } from './src/loader';
import { loadReverseDictionary } from './src/reverse';
import { loadFrequencies } from './src/frequency';
import { loadLangDict } from 'ingglish'; // registers English word resolver + G2P

await Promise.all([
  loadDictionary(),
  loadReverseDictionary(),
  loadFrequencies(),
  loadLangDict('en'),
]);
