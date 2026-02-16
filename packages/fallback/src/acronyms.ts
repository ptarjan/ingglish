/**
 * Acronym and initialism handling.
 *
 * Handles words that should be spelled out letter-by-letter
 * (e.g., URL -> "you-are-ell") vs acronyms pronounced as words
 * (e.g., NASA -> "nasa").
 */

import { arpabetToFormat } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';

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
  php: ['hypertext', 'preprocessor'],
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
  rsvp: ['please', 'respond'],
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

  // Acronyms pronounced as words (pass through unchanged like initialisms)
  nato: ['north', 'atlantic', 'treaty', 'organization'],
  nasa: ['national', 'aeronautics', 'space', 'administration'],

  // Government / organizations
  fbi: ['federal', 'bureau', 'of', 'investigation'],
  cia: ['central', 'intelligence', 'agency'],
  nsa: ['national', 'security', 'agency'],
  irs: ['internal', 'revenue', 'service'],
  fda: ['food', 'and', 'drug', 'administration'],
  epa: ['environmental', 'protection', 'agency'],
  dea: ['drug', 'enforcement', 'administration'],
  dmv: ['department', 'of', 'motor', 'vehicles'],
  us: ['united', 'states'],
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
