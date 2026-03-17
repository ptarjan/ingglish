import type { ReactNode } from 'react';
import { useDictLoading } from '../DictContext';

/** Wrapper that shows a loading spinner until the dictionary is ready. */
export function DictGate({ children }: { children: ReactNode }) {
  const { error, isLoading } = useDictLoading();

  if (error !== null) {
    return (
      <div className="error-screen">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return children;
}
