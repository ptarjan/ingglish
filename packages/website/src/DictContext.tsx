import { createContext, useContext } from 'react';

interface DictState {
  error: null | string;
  isLoading: boolean;
}

export const DictContext = createContext<DictState>({ error: null, isLoading: true });
export const useDictLoading = () => useContext(DictContext);
