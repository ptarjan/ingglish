import { useState, useCallback, useEffect, useRef } from 'react';
import type { CustomMappingConfig } from '@ingglish/phonemes';
import {
  registerFormat,
  createCustomConverter,
  ARPABET_TO_INGGLISH_MAP,
  R_COLORED_FORWARD,
} from '@ingglish/phonemes';
import { trackExperimentCustomize } from '../analytics';

/** Default phoneme map including AH0 */
const DEFAULT_PHONEME_MAP: Record<string, string> = {
  ...ARPABET_TO_INGGLISH_MAP,
  AH0: 'a',
};

/** Default R-colored prefixes as a plain object */
const DEFAULT_R_COLORED: Record<string, string> = Object.fromEntries(R_COLORED_FORWARD);

/** Storage key for localStorage */
const STORAGE_KEY = 'experimentMapping';

export interface UseCustomMappingReturn {
  /** The underlying diff-only config */
  config: CustomMappingConfig;
  /** Whether the current mapping differs from defaults */
  hasCustomizations: boolean;
  /** Full phoneme map (defaults + overrides) */
  phonemeMap: Record<string, string>;
  /** Full r-colored prefix map (defaults + overrides) */
  rColoredPrefixes: Record<string, string>;
  /** Reset all mappings to defaults */
  reset: () => void;
  /** Set a single phoneme spelling */
  setPhonemeSpelling: (phoneme: string, spelling: string) => void;
  /** Set a single r-colored prefix */
  setRColoredPrefix: (vowel: string, prefix: string) => void;
  /** Get a shareable URL for the current mapping */
  shareUrl: string;
  /** A version counter that increments on every change (for triggering re-renders) */
  version: number;
}

/** Check if a custom experiment mapping exists in localStorage */
export function hasExperimentMapping(): boolean {
  return loadFromStorage() !== null;
}

/** Register the experiment format from localStorage (if any). Call at app startup. */
export function registerExperiment(): void {
  const stored = loadFromStorage();
  registerExperimentFormat(stored ?? { phonemeMap: {}, rColoredPrefixes: {} });
}

export function useCustomMapping(): UseCustomMappingReturn {
  const [config, setConfig] = useState<CustomMappingConfig>(() => {
    // Priority: URL hash > localStorage > defaults
    const hashConfig = decodeFromHash(globalThis.location.hash);
    if (hashConfig) {
      saveToStorage(hashConfig);
      registerExperimentFormat(hashConfig);
      return hashConfig;
    }
    const storedConfig = loadFromStorage();
    if (storedConfig) {
      registerExperimentFormat(storedConfig);
      return storedConfig;
    }
    const empty: CustomMappingConfig = { phonemeMap: {}, rColoredPrefixes: {} };
    registerExperimentFormat(empty);
    return empty;
  });

  const [version, setVersion] = useState(0);

  // Track experiment customizations with debounce (skip initial version 0)
  useEffect(() => {
    if (version === 0) {
      return;
    }
    const timer = setTimeout(() => {
      trackExperimentCustomize();
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, [version]);

  // Listen for hashchange events (e.g. preset link clicks)
  useEffect(() => {
    const onHashChange = () => {
      const hashConfig = decodeFromHash(globalThis.location.hash);
      if (hashConfig) {
        // Register eagerly so translateSync sees the new format during this render
        registerExperimentFormat(hashConfig);
        setConfig(hashConfig);
        setVersion((v) => v + 1);
      }
    };
    globalThis.addEventListener('hashchange', onHashChange);
    return () => {
      globalThis.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Keep a ref to avoid stale closures
  const configRef = useRef(config);
  configRef.current = config;

  // Re-register format whenever config changes
  useEffect(() => {
    registerExperimentFormat(config);
    saveToStorage(config);
  }, [config]);

  const setPhonemeSpelling = useCallback((phoneme: string, spelling: string) => {
    setConfig((prev) => {
      let next: CustomMappingConfig;
      if (spelling.length > 0) {
        const fullMap = buildFullPhonemeMap(prev.phonemeMap);
        fullMap[phoneme] = spelling;
        next = { ...prev, phonemeMap: computePhonemeMapDiffs(fullMap) };
      } else {
        // Empty spelling = remove any override for this phoneme
        const filtered = Object.fromEntries(
          Object.entries(prev.phonemeMap).filter(([k]) => k !== phoneme)
        );
        next = { ...prev, phonemeMap: filtered };
      }
      // Register eagerly so translateSync sees the new format during this render
      registerExperimentFormat(next);
      return next;
    });
    setVersion((v) => v + 1);
  }, []);

  const setRColoredPrefix = useCallback((vowel: string, prefix: string) => {
    setConfig((prev) => {
      const fullMap = buildFullRColoredMap(prev.rColoredPrefixes);
      fullMap[vowel] = prefix;
      const newDiffs = computeRColoredDiffs(fullMap);
      const next = { ...prev, rColoredPrefixes: newDiffs };
      // Register eagerly so translateSync sees the new format during this render
      registerExperimentFormat(next);
      return next;
    });
    setVersion((v) => v + 1);
  }, []);

  const reset = useCallback(() => {
    setConfig({ phonemeMap: {}, rColoredPrefixes: {} });
    setVersion((v) => v + 1);
    // Clear URL hash
    if (globalThis.location.hash) {
      globalThis.history.replaceState(null, '', globalThis.location.pathname);
    }
  }, []);

  const hasCustomizations = hasDiffs(config);

  const shareUrl =
    globalThis.location.origin +
    '/experiment' +
    (hasCustomizations ? '#' + encodeToHash(config) : '');

  const phonemeMap = buildFullPhonemeMap(config.phonemeMap);
  const rColoredPrefixes = buildFullRColoredMap(config.rColoredPrefixes);

  return {
    config,
    hasCustomizations,
    phonemeMap,
    rColoredPrefixes,
    reset,
    setPhonemeSpelling,
    setRColoredPrefix,
    shareUrl,
    version,
  };
}

/** Full phoneme map = defaults merged with diffs */
function buildFullPhonemeMap(diffs: Record<string, string>): Record<string, string> {
  return { ...DEFAULT_PHONEME_MAP, ...diffs };
}

/** Full r-colored map = defaults merged with diffs */
function buildFullRColoredMap(diffs: Record<string, string>): Record<string, string> {
  return { ...DEFAULT_R_COLORED, ...diffs };
}

/** Compute diffs from default for phonemeMap */
function computePhonemeMapDiffs(fullMap: Record<string, string>): Record<string, string> {
  const diffs: Record<string, string> = {};
  for (const [key, value] of Object.entries(fullMap)) {
    if (DEFAULT_PHONEME_MAP[key] !== value) {
      diffs[key] = value;
    }
  }
  return diffs;
}

/** Compute diffs from default for rColoredPrefixes */
function computeRColoredDiffs(fullMap: Record<string, string>): Record<string, string> {
  const diffs: Record<string, string> = {};
  for (const [key, value] of Object.entries(fullMap)) {
    if (DEFAULT_R_COLORED[key] !== value) {
      diffs[key] = value;
    }
  }
  return diffs;
}

/** Decode URL hash string to custom mapping config (diffs only) */
function decodeFromHash(hash: string): CustomMappingConfig | null {
  if (hash.length === 0) {
    return null;
  }
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw.length === 0) {
    return null;
  }
  let clean: string;
  try {
    clean = decodeURIComponent(raw);
  } catch {
    clean = raw;
  }

  const config: CustomMappingConfig = { phonemeMap: {}, rColoredPrefixes: {} };
  const params = clean.split('&');

  for (const param of params) {
    const eqIndex = param.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }
    const key = param.slice(0, eqIndex);
    const value = param.slice(eqIndex + 1);

    if (key === 'm') {
      for (const pair of value.split(',')) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) {
          continue;
        }
        config.phonemeMap[pair.slice(0, colonIndex)] = pair.slice(colonIndex + 1);
      }
    } else if (key === 'r') {
      for (const pair of value.split(',')) {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) {
          continue;
        }
        config.rColoredPrefixes[pair.slice(0, colonIndex)] = pair.slice(colonIndex + 1);
      }
    }
  }

  return hasDiffs(config) ? config : null;
}

/** Encode a custom mapping config (diffs only) to URL hash string */
function encodeToHash(config: CustomMappingConfig): string {
  const parts: string[] = [];
  if (Object.keys(config.phonemeMap).length > 0) {
    const m = Object.entries(config.phonemeMap)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    parts.push(`m=${m}`);
  }
  if (Object.keys(config.rColoredPrefixes).length > 0) {
    const r = Object.entries(config.rColoredPrefixes)
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    parts.push(`r=${r}`);
  }
  return parts.length > 0 ? parts.join('&') : '';
}

/** Check if any mapping value uses a cased non-Latin script (Cyrillic, Greek) */
function hasCasedNonLatinChars(config: CustomMappingConfig): boolean {
  for (const value of Object.values(config.phonemeMap)) {
    if (/[\u0370-\u03FF\u0400-\u04FF]/.test(value)) {
      return true;
    }
  }
  return false;
}

/** Check if a custom mapping has any diffs from defaults */
function hasDiffs(config: CustomMappingConfig): boolean {
  return (
    Object.keys(config.phonemeMap).length > 0 || Object.keys(config.rColoredPrefixes).length > 0
  );
}

/** Check if any mapping value contains non-Latin characters (IPA, Shavian, Cyrillic, etc.) */
function isNonLatinMapping(config: CustomMappingConfig): boolean {
  for (const value of Object.values(config.phonemeMap)) {
    if (/[^\u0020-\u024F]/.test(value)) {
      return true;
    }
  }
  return false;
}

/** Load config from localStorage */
function loadFromStorage(): CustomMappingConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as CustomMappingConfig;
    if (parsed.phonemeMap !== undefined && parsed.rColoredPrefixes !== undefined) {
      return hasDiffs(parsed) ? parsed : null;
    }
  } catch {
    // Invalid JSON or missing fields
  }
  return null;
}

/** Register the experiment format with the given config */
function registerExperimentFormat(config: CustomMappingConfig): void {
  const converter = createCustomConverter(config);
  const isLatin = !isNonLatinMapping(config);
  registerFormat('experiment', {
    forward: converter,
    isLatinScript: isLatin,
    label: 'Experiment',
    preservesCase: isLatin || hasCasedNonLatinChars(config),
  });
}

/** Save config to localStorage */
function saveToStorage(config: CustomMappingConfig): void {
  try {
    if (hasDiffs(config)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}
