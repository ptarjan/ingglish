import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { OutputFormat } from '@ingglish/phonemes';
import { hasExperimentMapping } from '../hooks/useCustomMapping';

interface FormatContextType {
  format: OutputFormat;
  setFormat: (format: OutputFormat) => void;
  toggleFormat: () => void;
}

const FormatContext = createContext<FormatContextType | null>(null);

interface FormatProviderProps {
  children: ReactNode;
}

export function FormatProvider({ children }: FormatProviderProps) {
  const [format, setFormatState] = useState<OutputFormat>(() => {
    try {
      const saved = localStorage.getItem('outputFormat');
      if (
        saved === 'ingglish' ||
        saved === 'ipa' ||
        saved === 'shavian' ||
        saved === 'deseret' ||
        (saved === 'experiment' && hasExperimentMapping())
      ) {
        return saved;
      }
    } catch {
      // localStorage unavailable
    }
    return 'ingglish';
  });

  const setFormat = useCallback((newFormat: OutputFormat) => {
    setFormatState(newFormat);
    try {
      localStorage.setItem('outputFormat', newFormat);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggleFormat = useCallback(() => {
    setFormatState((prev) => {
      const base: OutputFormat[] = ['ingglish', 'ipa', 'shavian', 'deseret'];
      const FORMAT_ORDER: OutputFormat[] = hasExperimentMapping() ? [...base, 'experiment'] : base;
      const newFormat = FORMAT_ORDER[(FORMAT_ORDER.indexOf(prev) + 1) % FORMAT_ORDER.length];
      try {
        localStorage.setItem('outputFormat', newFormat);
      } catch {
        // localStorage unavailable
      }
      return newFormat;
    });
  }, []);

  return (
    <FormatContext.Provider value={{ format, setFormat, toggleFormat }}>
      {children}
    </FormatContext.Provider>
  );
}

export function useFormat(): FormatContextType {
  const context = useContext(FormatContext);
  if (context === null) {
    throw new Error('useFormat must be used within a FormatProvider');
  }
  return context;
}
