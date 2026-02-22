/**
 * Acronym and initialism handling.
 *
 * Handles words that should be spelled out letter-by-letter
 * (e.g., URL -> "you-are-ell") vs acronyms pronounced as words
 * (e.g., NASA -> "nasa").
 */

import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToFormat } from '@ingglish/phonemes';

/**
 * Expansions for known initialisms.
 * Maps lowercase initialism to the words it stands for.
 */
export const INITIALISM_EXPANSIONS: Record<string, string[]> = {
  ac: ['alternating', 'current'],
  ad: ['anno', 'domini'],

  afk: ['away', 'from', 'keyboard'],
  // AI / ML
  ai: ['artificial', 'intelligence'],
  aka: ['also', 'known', 'as'],
  am: ['ante', 'meridiem'],
  api: ['application', 'programming', 'interface'],
  asap: ['as', 'soon', 'as', 'possible'],
  atm: ['automated', 'teller', 'machine'],
  aws: ['amazon', 'web', 'services'],
  b2b: ['business', 'to', 'business'],
  b2c: ['business', 'to', 'consumer'],
  bc: ['before', 'christ'],
  bdd: ['behavior', 'driven', 'development'],
  brb: ['be', 'right', 'back'],
  btw: ['by', 'the', 'way'],
  byob: ['bring', 'your', 'own', 'bottle'],
  cd: ['continuous', 'deployment'],
  cdn: ['content', 'delivery', 'network'],
  // Business / titles
  ceo: ['chief', 'executive', 'officer'],
  cfo: ['chief', 'financial', 'officer'],
  ci: ['continuous', 'integration'],
  cia: ['central', 'intelligence', 'agency'],
  cio: ['chief', 'information', 'officer'],
  cli: ['command', 'line', 'interface'],
  cmo: ['chief', 'marketing', 'officer'],

  cms: ['content', 'management', 'system'],
  cnn: ['convolutional', 'neural', 'network'],
  coo: ['chief', 'operating', 'officer'],
  cors: ['cross', 'origin', 'resource', 'sharing'],
  cpr: ['cardiopulmonary', 'resuscitation'],
  cpu: ['central', 'processing', 'unit'],
  crm: ['customer', 'relationship', 'management'],
  crud: ['create', 'read', 'update', 'delete'],
  cso: ['chief', 'security', 'officer'],
  css: ['cascading', 'style', 'sheets'],

  csv: ['comma', 'separated', 'values'],
  cto: ['chief', 'technology', 'officer'],
  dc: ['direct', 'current'],
  ddos: ['distributed', 'denial', 'of', 'service'],
  dea: ['drug', 'enforcement', 'administration'],
  diy: ['do', 'it', 'yourself'],
  dj: ['disc', 'jockey'],
  dmv: ['department', 'of', 'motor', 'vehicles'],
  // Medical / science
  dna: ['deoxyribonucleic', 'acid'],
  dns: ['domain', 'name', 'system'],
  eod: ['end', 'of', 'day'],
  epa: ['environmental', 'protection', 'agency'],
  er: ['emergency', 'room'],

  erp: ['enterprise', 'resource', 'planning'],
  eta: ['estimated', 'time', 'of', 'arrival'],
  etl: ['extract', 'transform', 'load'],
  eu: ['european', 'union'],
  faq: ['frequently', 'asked', 'questions'],

  // Government / organizations
  fbi: ['federal', 'bureau', 'of', 'investigation'],
  fda: ['food', 'and', 'drug', 'administration'],
  ftp: ['file', 'transfer', 'protocol'],
  fyi: ['for', 'your', 'information'],
  gan: ['generative', 'adversarial', 'network'],
  gcp: ['google', 'cloud', 'platform'],
  gif: ['graphics', 'interchange', 'format'],
  gps: ['global', 'positioning', 'system'],
  gpt: ['generative', 'pre-trained', 'transformer'],
  gpu: ['graphics', 'processing', 'unit'],
  gui: ['graphical', 'user', 'interface'],
  hdd: ['hard', 'disk', 'drive'],
  hiv: ['human', 'immunodeficiency', 'virus'],
  hr: ['human', 'resources'],
  html: ['hypertext', 'markup', 'language'],
  http: ['hypertext', 'transfer', 'protocol'],
  https: ['hypertext', 'transfer', 'protocol', 'secure'],
  iaas: ['infrastructure', 'as', 'a', 'service'],
  icu: ['intensive', 'care', 'unit'],
  // General / common
  id: ['identification'],
  ide: ['integrated', 'development', 'environment'],
  idk: ['i', "don't", 'know'],
  imo: ['in', 'my', 'opinion'],

  io: ['input', 'output'],
  ip: ['internet', 'protocol'],
  iq: ['intelligence', 'quotient'],
  irs: ['internal', 'revenue', 'service'],
  isp: ['internet', 'service', 'provider'],
  it: ['information', 'technology'],
  jpeg: ['joint', 'photographic', 'experts', 'group'],
  // Media
  jpg: ['joint', 'photographic', 'experts', 'group'],
  json: ['javascript', 'object', 'notation'],
  jwt: ['json', 'web', 'token'],
  kpi: ['key', 'performance', 'indicator'],
  // Networking
  lan: ['local', 'area', 'network'],
  lcd: ['liquid', 'crystal', 'display'],
  led: ['light', 'emitting', 'diode'],
  llm: ['large', 'language', 'model'],
  mc: ['master', 'of', 'ceremonies'],
  // Security
  mfa: ['multi', 'factor', 'authentication'],
  ml: ['machine', 'learning'],
  mp3: ['moving', 'picture', 'experts', 'group', 'audio', 'layer'],
  mp4: ['moving', 'picture', 'experts', 'group'],
  mph: ['miles', 'per', 'hour'],
  mri: ['magnetic', 'resonance', 'imaging'],
  mvp: ['minimum', 'viable', 'product'],
  nasa: ['national', 'aeronautics', 'space', 'administration'],
  // Acronyms pronounced as words (pass through unchanged like initialisms)
  nato: ['north', 'atlantic', 'treaty', 'organization'],
  nda: ['non', 'disclosure', 'agreement'],
  nic: ['network', 'interface', 'card'],
  nlp: ['natural', 'language', 'processing'],
  nosql: ['not', 'only', 'sql'],
  nsa: ['national', 'security', 'agency'],
  nsfw: ['not', 'safe', 'for', 'work'],
  nyc: ['new', 'york', 'city'],
  omg: ['oh', 'my', 'god'],
  ooo: ['out', 'of', 'office'],
  // Development
  oop: ['object', 'oriented', 'programming'],
  orm: ['object', 'relational', 'mapping'],
  os: ['operating', 'system'],
  otp: ['one', 'time', 'password'],
  paas: ['platform', 'as', 'a', 'service'],

  pc: ['personal', 'computer'],
  pdf: ['portable', 'document', 'format'],

  php: ['hypertext', 'preprocessor'],
  pm: ['post', 'meridiem'],
  png: ['portable', 'network', 'graphics'],
  pov: ['point', 'of', 'view'],
  pr: ['public', 'relations'],
  pto: ['paid', 'time', 'off'],
  qa: ['quality', 'assurance'],
  rag: ['retrieval', 'augmented', 'generation'],
  ram: ['random', 'access', 'memory'],
  rfp: ['request', 'for', 'proposal'],
  rip: ['rest', 'in', 'peace'],
  rna: ['ribonucleic', 'acid'],
  rnn: ['recurrent', 'neural', 'network'],
  roi: ['return', 'on', 'investment'],

  rom: ['read', 'only', 'memory'],
  rpm: ['revolutions', 'per', 'minute'],
  rsvp: ['please', 'respond'],
  rv: ['recreational', 'vehicle'],
  // Cloud / services
  saas: ['software', 'as', 'a', 'service'],
  sdk: ['software', 'development', 'kit'],
  sftp: ['secure', 'file', 'transfer', 'protocol'],

  sla: ['service', 'level', 'agreement'],
  // Database
  sql: ['structured', 'query', 'language'],
  ssd: ['solid', 'state', 'drive'],
  ssh: ['secure', 'shell'],
  ssl: ['secure', 'sockets', 'layer'],
  suv: ['sport', 'utility', 'vehicle'],
  svg: ['scalable', 'vector', 'graphics'],
  tba: ['to', 'be', 'announced'],
  tbd: ['to', 'be', 'determined'],

  tcp: ['transmission', 'control', 'protocol'],
  tdd: ['test', 'driven', 'development'],
  tldr: ['too', 'long', "didn't", 'read'],

  tls: ['transport', 'layer', 'security'],
  tv: ['television'],
  uat: ['user', 'acceptance', 'testing'],

  udp: ['user', 'datagram', 'protocol'],
  // User interface / experience
  ui: ['user', 'interface'],
  uk: ['united', 'kingdom'],
  un: ['united', 'nations'],
  uri: ['uniform', 'resource', 'identifier'],
  // Tech / web
  url: ['uniform', 'resource', 'locator'],
  us: ['united', 'states'],
  usa: ['united', 'states', 'of', 'america'],
  // Hardware
  usb: ['universal', 'serial', 'bus'],
  uv: ['ultraviolet'],

  ux: ['user', 'experience'],
  vp: ['vice', 'president'],
  vpn: ['virtual', 'private', 'network'],
  wan: ['wide', 'area', 'network'],
  xml: ['extensible', 'markup', 'language'],
  xss: ['cross', 'site', 'scripting'],
};

// Longest initialism in INITIALISM_EXPANSIONS (https, nosql = 5)
const MAX_INITIALISM_LENGTH = 5;

/**
 * Phonemes for individual letters (for spelling out acronyms).
 * Based on how native English speakers pronounce alphabet letters.
 */
export const LETTER_PHONEMES: Record<string, string[]> = {
  a: ['EY1'],
  b: ['B', 'IY1'],
  c: ['S', 'IY1'],
  d: ['D', 'IY1'],
  e: ['IY1'],
  f: ['EH1', 'F'],
  g: ['JH', 'IY1'],
  h: ['EY1', 'CH'],
  i: ['AY1'],
  j: ['JH', 'EY1'],
  k: ['K', 'EY1'],
  l: ['EH1', 'L'],
  m: ['EH1', 'M'],
  n: ['EH1', 'N'],
  o: ['OW1'],
  p: ['P', 'IY1'],
  q: ['K', 'Y', 'UW1'],
  r: ['AA1', 'R'],
  s: ['EH1', 'S'],
  t: ['T', 'IY1'],
  u: ['Y', 'UW1'],
  v: ['V', 'IY1'],
  w: ['D', 'AH1', 'B', 'AH0', 'L', 'Y', 'UW0'],
  x: ['EH1', 'K', 'S'],
  y: ['W', 'AY1'],
  z: ['Z', 'IY1'],
};

/**
 * Known initialisms - derived from INITIALISM_EXPANSIONS for consistency.
 * These are pronounced as individual letters, NOT as words.
 *
 * Excludes acronyms pronounced as words like:
 * - RAM (ram), ROM (rom), GIF (gif/jif), JPEG (jay-peg)
 * - JSON (jason), SQL (sequel), NASA, NATO, SCUBA, LASER
 */
export const KNOWN_INITIALISMS = new Set(Object.keys(INITIALISM_EXPANSIONS));

/**
 * Checks if a word should be spelled out as individual letters (initialism).
 * Only returns true for known initialisms - unknown uppercase words are NOT
 * automatically treated as initialisms since they might be acronyms pronounced
 * as words (like NASA, GIF, etc).
 */
export function isInitialism(word: string): boolean {
  // Fast path: skip words longer than any known initialism
  if (word.length > MAX_INITIALISM_LENGTH) {
    return false;
  }
  return KNOWN_INITIALISMS.has(word.toLowerCase());
}

// Common suffixes for initialisms (plural, possessive)
const INITIALISM_SUFFIXES = ["'s", 's'] as const;

/**
 * Checks if a word is an initialism with a suffix (e.g., "IDs", "TVs", "URLs", "API's").
 * Returns the base initialism and suffix if matched, null otherwise.
 */
export function parseInitialismWithSuffix(word: string): null | { base: string; suffix: string } {
  for (const suffix of INITIALISM_SUFFIXES) {
    if (word.length > suffix.length && word.endsWith(suffix)) {
      const base = word.slice(0, -suffix.length);
      if (isInitialism(base)) {
        return { base, suffix };
      }
    }
  }
  return null;
}

/**
 * Translates a word by spelling out each letter.
 * Used for acronyms like URL, HTML, API.
 */
export function translateAsAcronym(word: string, format: OutputFormat = 'ingglish'): string {
  const arpabet: string[] = [];
  for (const char of word.toLowerCase()) {
    const letterArpabet = LETTER_PHONEMES[char];
    if (letterArpabet !== undefined) {
      arpabet.push(...letterArpabet);
    }
  }
  return arpabetToFormat(arpabet, format);
}
