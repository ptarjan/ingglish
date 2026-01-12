/**
 * Initialism handling with expansion-based translation.
 *
 * Initialisms are abbreviations spelled out letter-by-letter (e.g., UI, API).
 * This module translates them by taking the first letter of each translated
 * expansion word (e.g., UI = User Interface → Yoozer Interfays → YI).
 */

import type { OutputFormat } from '../types';

// Will be set by forward.ts to break circular dependency
let translateWordFn: ((word: string, format: OutputFormat) => string) | null = null;

// Small connector words to skip in initialism expansion (O(1) lookup)
const SKIP_WORDS = new Set(['a', 'as', 'of', 'it', 'the', 'an', 'to', 'in', 'on', 'per']);

/**
 * Sets the translateWord function to break circular dependency.
 */
export function setInitialismTranslateWordFn(
  fn: (word: string, format: OutputFormat) => string
): void {
  translateWordFn = fn;
}

/**
 * Expansions for known initialisms.
 * Maps lowercase initialism to the words it stands for.
 */
export const INITIALISM_EXPANSIONS: Record<string, string[]> = {
  // User interface / experience
  ui: ['user', 'interface'],
  ux: ['user', 'experience'],

  // Tech / web
  url: ['uniform', 'resource', 'locator'],
  uri: ['uniform', 'resource', 'identifier'],
  html: ['hypertext', 'markup', 'language'],
  css: ['cascading', 'style', 'sheets'],
  api: ['application', 'programming', 'interface'],
  http: ['hypertext', 'transfer', 'protocol'],
  https: ['hypertext', 'transfer', 'protocol', 'secure'],
  xml: ['extensible', 'markup', 'language'],
  php: ['hypertext', 'preprocessor'], // Originally "Personal Home Page"
  pdf: ['portable', 'document', 'format'],
  svg: ['scalable', 'vector', 'graphics'],
  json: ['javascript', 'object', 'notation'],
  csv: ['comma', 'separated', 'values'],
  sdk: ['software', 'development', 'kit'],
  ide: ['integrated', 'development', 'environment'],
  cli: ['command', 'line', 'interface'],
  gui: ['graphical', 'user', 'interface'],
  cms: ['content', 'management', 'system'],
  cdn: ['content', 'delivery', 'network'],
  jwt: ['json', 'web', 'token'],
  cors: ['cross', 'origin', 'resource', 'sharing'],
  xss: ['cross', 'site', 'scripting'],
  io: ['input', 'output'],
  os: ['operating', 'system'],

  // Hardware
  usb: ['universal', 'serial', 'bus'],
  cpu: ['central', 'processing', 'unit'],
  gpu: ['graphics', 'processing', 'unit'],
  ssd: ['solid', 'state', 'drive'],
  hdd: ['hard', 'disk', 'drive'],
  ram: ['random', 'access', 'memory'],
  rom: ['read', 'only', 'memory'],
  lcd: ['liquid', 'crystal', 'display'],
  led: ['light', 'emitting', 'diode'],
  nic: ['network', 'interface', 'card'],

  // Networking
  lan: ['local', 'area', 'network'],
  wan: ['wide', 'area', 'network'],
  dns: ['domain', 'name', 'system'],
  ip: ['internet', 'protocol'],
  tcp: ['transmission', 'control', 'protocol'],
  udp: ['user', 'datagram', 'protocol'],
  vpn: ['virtual', 'private', 'network'],
  ssh: ['secure', 'shell'],
  ftp: ['file', 'transfer', 'protocol'],
  sftp: ['secure', 'file', 'transfer', 'protocol'],
  ssl: ['secure', 'sockets', 'layer'],
  tls: ['transport', 'layer', 'security'],
  isp: ['internet', 'service', 'provider'],

  // Cloud / services
  saas: ['software', 'as', 'a', 'service'],
  paas: ['platform', 'as', 'a', 'service'],
  iaas: ['infrastructure', 'as', 'a', 'service'],
  aws: ['amazon', 'web', 'services'],
  gcp: ['google', 'cloud', 'platform'],

  // Business / titles
  ceo: ['chief', 'executive', 'officer'],
  cfo: ['chief', 'financial', 'officer'],
  cto: ['chief', 'technology', 'officer'],
  coo: ['chief', 'operating', 'officer'],
  cmo: ['chief', 'marketing', 'officer'],
  cio: ['chief', 'information', 'officer'],
  cso: ['chief', 'security', 'officer'],
  vp: ['vice', 'president'],
  hr: ['human', 'resources'],
  pr: ['public', 'relations'],
  it: ['information', 'technology'],
  crm: ['customer', 'relationship', 'management'],
  erp: ['enterprise', 'resource', 'planning'],
  roi: ['return', 'on', 'investment'],
  kpi: ['key', 'performance', 'indicator'],
  nda: ['non', 'disclosure', 'agreement'],
  sla: ['service', 'level', 'agreement'],
  rfp: ['request', 'for', 'proposal'],
  b2b: ['business', 'to', 'business'],
  b2c: ['business', 'to', 'consumer'],
  pto: ['paid', 'time', 'off'],
  ooo: ['out', 'of', 'office'],
  eod: ['end', 'of', 'day'],

  // General / common
  id: ['identification'],
  tv: ['television'],
  pc: ['personal', 'computer'],
  dj: ['disc', 'jockey'],
  mc: ['master', 'of', 'ceremonies'],
  atm: ['automated', 'teller', 'machine'],
  gps: ['global', 'positioning', 'system'],
  suv: ['sport', 'utility', 'vehicle'],
  rv: ['recreational', 'vehicle'],
  uv: ['ultraviolet'],
  iq: ['intelligence', 'quotient'],
  faq: ['frequently', 'asked', 'questions'],
  diy: ['do', 'it', 'yourself'],
  eta: ['estimated', 'time', 'of', 'arrival'],
  mph: ['miles', 'per', 'hour'],
  rpm: ['revolutions', 'per', 'minute'],
  ac: ['alternating', 'current'],
  dc: ['direct', 'current'],
  am: ['ante', 'meridiem'],
  pm: ['post', 'meridiem'],
  bc: ['before', 'christ'],
  ad: ['anno', 'domini'],
  rip: ['rest', 'in', 'peace'],
  aka: ['also', 'known', 'as'],
  asap: ['as', 'soon', 'as', 'possible'],
  rsvp: ['please', 'respond'], // From French "répondez s'il vous plaît"
  byob: ['bring', 'your', 'own', 'bottle'],
  tba: ['to', 'be', 'announced'],
  tbd: ['to', 'be', 'determined'],
  fyi: ['for', 'your', 'information'],
  btw: ['by', 'the', 'way'],
  imo: ['in', 'my', 'opinion'],
  idk: ['i', "don't", 'know'],
  omg: ['oh', 'my', 'god'],
  brb: ['be', 'right', 'back'],
  afk: ['away', 'from', 'keyboard'],
  pov: ['point', 'of', 'view'],
  nsfw: ['not', 'safe', 'for', 'work'],
  tldr: ['too', 'long', "didn't", 'read'],

  // Government / organizations
  fbi: ['federal', 'bureau', 'of', 'investigation'],
  cia: ['central', 'intelligence', 'agency'],
  nsa: ['national', 'security', 'agency'],
  irs: ['internal', 'revenue', 'service'],
  fda: ['food', 'and', 'drug', 'administration'],
  epa: ['environmental', 'protection', 'agency'],
  dea: ['drug', 'enforcement', 'administration'],
  dmv: ['department', 'of', 'motor', 'vehicles'],
  usa: ['united', 'states', 'of', 'america'],
  uk: ['united', 'kingdom'],
  eu: ['european', 'union'],
  un: ['united', 'nations'],
  nyc: ['new', 'york', 'city'],

  // Medical / science
  dna: ['deoxyribonucleic', 'acid'],
  rna: ['ribonucleic', 'acid'],
  mri: ['magnetic', 'resonance', 'imaging'],
  icu: ['intensive', 'care', 'unit'],
  cpr: ['cardiopulmonary', 'resuscitation'],
  hiv: ['human', 'immunodeficiency', 'virus'],
  er: ['emergency', 'room'],

  // AI / ML
  ai: ['artificial', 'intelligence'],
  ml: ['machine', 'learning'],
  nlp: ['natural', 'language', 'processing'],
  llm: ['large', 'language', 'model'],
  gpt: ['generative', 'pre-trained', 'transformer'],
  cnn: ['convolutional', 'neural', 'network'],
  rnn: ['recurrent', 'neural', 'network'],
  gan: ['generative', 'adversarial', 'network'],
  rag: ['retrieval', 'augmented', 'generation'],

  // Security
  mfa: ['multi', 'factor', 'authentication'],
  otp: ['one', 'time', 'password'],
  ddos: ['distributed', 'denial', 'of', 'service'],

  // Database
  sql: ['structured', 'query', 'language'],
  nosql: ['not', 'only', 'sql'],
  crud: ['create', 'read', 'update', 'delete'],

  // Development
  oop: ['object', 'oriented', 'programming'],
  mvp: ['minimum', 'viable', 'product'],
  qa: ['quality', 'assurance'],
  uat: ['user', 'acceptance', 'testing'],
  ci: ['continuous', 'integration'],
  cd: ['continuous', 'deployment'],
  tdd: ['test', 'driven', 'development'],
  bdd: ['behavior', 'driven', 'development'],
  orm: ['object', 'relational', 'mapping'],
  etl: ['extract', 'transform', 'load'],

  // Media
  jpg: ['joint', 'photographic', 'experts', 'group'],
  jpeg: ['joint', 'photographic', 'experts', 'group'],
  gif: ['graphics', 'interchange', 'format'],
  png: ['portable', 'network', 'graphics'],
  mp3: ['moving', 'picture', 'experts', 'group', 'audio', 'layer'],
  mp4: ['moving', 'picture', 'experts', 'group'],
};

// Longest initialism in INITIALISM_EXPANSIONS (https, nosql = 5)
const MAX_INITIALISM_LENGTH = 5;

/**
 * Checks if a word is a known initialism with an expansion.
 */
export function isInitialism(word: string): boolean {
  // Fast path: skip words longer than any known initialism
  if (word.length > MAX_INITIALISM_LENGTH) {
    return false;
  }
  return word.toLowerCase() in INITIALISM_EXPANSIONS;
}

/**
 * Translates an initialism using first letters of translated expansion words.
 * Example: UI = User Interface → Yoozer Interfays → YI
 *
 * Returns null if translation not possible, including for single-word expansions
 * (e.g., TV = television) which should be spelled out letter-by-letter instead.
 */
export function translateInitialism(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
  if (!translateWordFn) {
    return null;
  }

  const lower = word.toLowerCase();
  const expansion = INITIALISM_EXPANSIONS[lower];

  if (expansion === undefined) {
    return null;
  }

  // Single-word expansions (like TV = television) should be spelled out letter-by-letter
  // rather than taking the first letter. Return null to fall through to translateAsAcronym.
  if (expansion.length === 1) {
    return null;
  }

  // For IPA, we might want to spell it out differently
  // For now, only do expansion-based translation for Ingglish
  if (format !== 'ingglish') {
    return null;
  }

  // Translate each expansion word and take first grapheme (may be digraph)
  const firstGraphemes: string[] = [];

  // Ingglish digraphs that represent single sounds
  const DIGRAPHS = ['sh', 'ch', 'th', 'dh', 'zh', 'ng'];

  for (const expansionWord of expansion) {
    // Skip small connector words (a, as, of, it, etc.) - don't include in initialism
    if (SKIP_WORDS.has(expansionWord)) {
      continue;
    }

    const translated = translateWordFn(expansionWord, 'ingglish');
    if (translated && translated.length > 0) {
      // Get the first grapheme (could be a digraph like "sh", "ch", etc.)
      const firstTwo = translated.slice(0, 2).toLowerCase();
      if (DIGRAPHS.includes(firstTwo)) {
        firstGraphemes.push(firstTwo);
      } else {
        firstGraphemes.push(translated.charAt(0).toLowerCase());
      }
    }
  }

  if (firstGraphemes.length === 0) {
    return null;
  }

  const result = firstGraphemes.join('');

  // Initialisms stay all caps (UI → YI, API → API)
  // Only lowercase if original was lowercase
  if (word === word.toLowerCase()) {
    return result.toLowerCase();
  }
  return result.toUpperCase();
}
