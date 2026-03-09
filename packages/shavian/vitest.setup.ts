import './src/index'; // registers 'shavian' format
import { loadLangDict } from 'ingglish'; // side-effect: registers English word resolver + G2P

// Pre-load dictionary before any tests run in this worker
await loadLangDict('en');
