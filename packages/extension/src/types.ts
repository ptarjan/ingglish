// Message types for Chrome extension communication

import type { OutputFormat } from '@ingglish/phonemes';

export interface GetStateMessage {
  type: 'GET_STATE';
}

export interface ToggleMessage {
  type: 'TOGGLE';
}

export interface TranslateMessage {
  type: 'TRANSLATE';
}

export interface RestoreMessage {
  type: 'RESTORE';
}

export interface RetranslateMessage {
  type: 'RETRANSLATE';
  format: OutputFormat;
}

export interface SetFormatMessage {
  type: 'SET_FORMAT';
  format: OutputFormat;
}

export interface GetFormatMessage {
  type: 'GET_FORMAT';
}

// Batch translate words (for lightweight content script)
export interface TranslateWordsMessage {
  type: 'TRANSLATE_WORDS';
  words: string[];
  format: OutputFormat;
}

export type ExtensionMessage =
  | GetStateMessage
  | ToggleMessage
  | TranslateMessage
  | RestoreMessage
  | RetranslateMessage
  | SetFormatMessage
  | GetFormatMessage
  | TranslateWordsMessage;

export interface StateResponse {
  enabled: boolean;
  format?: OutputFormat;
}

export interface ToggleResponse {
  success: boolean;
  enabled?: boolean;
  error?: string;
}

export interface TranslateResponse {
  success: boolean;
  error?: string;
}

export interface FormatResponse {
  format: OutputFormat;
}

// Response for batch translation
export interface TranslateWordsResponse {
  translations: Record<string, string>;
}
