import { useState, useCallback, useEffect, useRef } from 'react';
import {
  registerFormat,
  createCustomConverter,
  ARPABET_TO_INGGLISH_MAP,
  R_COLORED_FORWARD,
} from '@ingglish/phonemes';
import type { CustomMappingConfig } from '@ingglish/phonemes';

/** Default phoneme map including AH0 */
const DEFAULT_PHONEME_MAP: Record<string, string> = {
  ...ARPABET_TO_INGGLISH_MAP,
  AH0: 'a',
};

/** Default R-colored prefixes as a plain object */
const DEFAULT_R_COLORED: Record<string, string> = Object.fromEntries(R_COLORED_FORWARD);

/** Storage key for localStorage */
const STORAGE_KEY = 'experimentMapping';

/** Check if a custom mapping has any diffs from defaults */
function hasDiffs(config: CustomMappingConfig): boolean {
  return (
    Object.keys(config.phonemeMap).length > 0 || Object.keys(config.rColoredPrefixes).length > 0
  );
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

/** Decode URL hash string to custom mapping config (diffs only) */
function decodeFromHash(hash: string): CustomMappingConfig | null {
  if (hash.length === 0) {
    return null;
  }
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  if (clean.length === 0) {
    return null;
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

/** Register the experiment format with the given config */
function registerExperimentFormat(config: CustomMappingConfig): void {
  const converter = createCustomConverter(config);
  registerFormat('experiment', { forward: converter, isLatinScript: true });
}

/** Full phoneme map = defaults merged with diffs */
function buildFullPhonemeMap(diffs: Record<string, string>): Record<string, string> {
  return { ...DEFAULT_PHONEME_MAP, ...diffs };
}

/** Full r-colored map = defaults merged with diffs */
function buildFullRColoredMap(diffs: Record<string, string>): Record<string, string> {
  return { ...DEFAULT_R_COLORED, ...diffs };
}

export interface UseCustomMappingReturn {
  /** Full phoneme map (defaults + overrides) */
  phonemeMap: Record<string, string>;
  /** Full r-colored prefix map (defaults + overrides) */
  rColoredPrefixes: Record<string, string>;
  /** The underlying diff-only config */
  config: CustomMappingConfig;
  /** Set a single phoneme spelling */
  setPhonemeSpelling: (phoneme: string, spelling: string) => void;
  /** Set a single r-colored prefix */
  setRColoredPrefix: (vowel: string, prefix: string) => void;
  /** Reset all mappings to defaults */
  reset: () => void;
  /** Get a shareable URL for the current mapping */
  shareUrl: string;
  /** Whether the current mapping differs from defaults */
  hasCustomizations: boolean;
  /** A version counter that increments on every change (for triggering re-renders) */
  version: number;
}

export function useCustomMapping(): UseCustomMappingReturn {
  const [config, setConfig] = useState<CustomMappingConfig>(() => {
    // Priority: URL hash > localStorage > defaults
    const hashConfig = decodeFromHash(window.location.hash);
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
      const fullMap = buildFullPhonemeMap(prev.phonemeMap);
      fullMap[phoneme] = spelling;
      const newDiffs = computePhonemeMapDiffs(fullMap);
      return { ...prev, phonemeMap: newDiffs };
    });
    setVersion((v) => v + 1);
  }, []);

  const setRColoredPrefix = useCallback((vowel: string, prefix: string) => {
    setConfig((prev) => {
      const fullMap = buildFullRColoredMap(prev.rColoredPrefixes);
      fullMap[vowel] = prefix;
      const newDiffs = computeRColoredDiffs(fullMap);
      return { ...prev, rColoredPrefixes: newDiffs };
    });
    setVersion((v) => v + 1);
  }, []);

  const reset = useCallback(() => {
    setConfig({ phonemeMap: {}, rColoredPrefixes: {} });
    setVersion((v) => v + 1);
    // Clear URL hash
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const hasCustomizations = hasDiffs(config);

  const shareUrl =
    window.location.origin + '/experiment' + (hasCustomizations ? '#' + encodeToHash(config) : '');

  const phonemeMap = buildFullPhonemeMap(config.phonemeMap);
  const rColoredPrefixes = buildFullRColoredMap(config.rColoredPrefixes);

  return {
    phonemeMap,
    rColoredPrefixes,
    config,
    setPhonemeSpelling,
    setRColoredPrefix,
    reset,
    shareUrl,
    hasCustomizations,
    version,
  };
}

/** Check if a custom experiment mapping exists in localStorage */
export function hasExperimentMapping(): boolean {
  return loadFromStorage() !== null;
}
