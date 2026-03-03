import { loadReverseDictionary } from '@ingglish/dictionary';
import { loadLangDict } from 'ingglish'; // side-effect: registers English word resolver + G2P

// Pre-load dictionaries before any tests run in this worker
await Promise.all([loadLangDict('en'), loadReverseDictionary()]);
