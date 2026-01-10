/**
 * Initialism handling with expansion-based translation.
 *
 * Initialisms are abbreviations spelled out letter-by-letter (e.g., UI, API).
 * This module translates them by taking the first letter of each translated
 * expansion word (e.g., UI = User Interface → Yoozer Interfays → YI).
 */

import { detectCasePattern, applyCasePattern } from '../utils/case';
import type { OutputFormat } from '../types';

// Will be set by forward.ts to break circular dependency
let translateWordFn: ((word: string, format: OutputFormat) => string) | null = null;

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
  sdk: ['software', 'development', 'kit'],
  ide: ['integrated', 'development', 'environment'],
  cli: ['command', 'line', 'interface'],
  gui: ['graphical', 'user', 'interface'],

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
  vp: ['vice', 'president'],
  hr: ['human', 'resources'],
  pr: ['public', 'relations'],
  it: ['information', 'technology'],
  crm: ['customer', 'relationship', 'management'],
  erp: ['enterprise', 'resource', 'planning'],

  // General / common
  id: ['identification'],
  tv: ['television'],
  pc: ['personal', 'computer'],
  dj: ['disc', 'jockey'],
  mc: ['master', 'of', 'ceremonies'],
  atm: ['automated', 'teller', 'machine'],
  gps: ['global', 'positioning', 'system'],
  fbi: ['federal', 'bureau', 'of', 'investigation'],
  cia: ['central', 'intelligence', 'agency'],
  dna: ['deoxyribonucleic', 'acid'],
  rna: ['ribonucleic', 'acid'],
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

  // AI / ML
  ai: ['artificial', 'intelligence'],
  ml: ['machine', 'learning'],
  nlp: ['natural', 'language', 'processing'],
  llm: ['large', 'language', 'model'],
  gpt: ['generative', 'pre-trained', 'transformer'],

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

  // Media
  jpg: ['joint', 'photographic', 'experts', 'group'],
  jpeg: ['joint', 'photographic', 'experts', 'group'],
  gif: ['graphics', 'interchange', 'format'],
  png: ['portable', 'network', 'graphics'],
  mp3: ['moving', 'picture', 'experts', 'group', 'audio', 'layer'],
  mp4: ['moving', 'picture', 'experts', 'group'],
};

/**
 * Checks if a word is a known initialism with an expansion.
 */
export function isInitialism(word: string): boolean {
  return word.toLowerCase() in INITIALISM_EXPANSIONS;
}

/**
 * Translates an initialism using first letters of translated expansion words.
 * Example: UI = User Interface → Yoozer Interfays → YI
 *
 * Returns null if translation not possible.
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

  // For IPA, we might want to spell it out differently
  // For now, only do expansion-based translation for Ingglish
  if (format !== 'ingglish') {
    return null;
  }

  // Translate each expansion word and take first letter
  const firstLetters: string[] = [];

  for (const expansionWord of expansion) {
    // Skip small connector words (a, as, of, it, etc.) - don't include in initialism
    if (['a', 'as', 'of', 'it', 'the', 'an', 'to', 'in', 'on', 'per'].includes(expansionWord)) {
      continue;
    }

    const translated = translateWordFn(expansionWord, 'ingglish');
    if (translated && translated.length > 0) {
      // Get the first letter of the translated word
      firstLetters.push(translated.charAt(0).toLowerCase());
    }
  }

  if (firstLetters.length === 0) {
    return null;
  }

  const result = firstLetters.join('');

  // Apply case pattern from original word
  const casePattern = detectCasePattern(word);
  return applyCasePattern(result, casePattern, word);
}
