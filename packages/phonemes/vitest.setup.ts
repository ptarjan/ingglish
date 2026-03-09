import { loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';
import '@ingglish/ipa'; // registers 'ipa' format
import { loadLangDict } from 'ingglish'; // side-effect: registers English word resolver + G2P

// Pre-load all dictionaries before any tests run in this worker
await Promise.all([loadLangDict('en'), loadReverseDictionary(), loadFrequencies()]);
