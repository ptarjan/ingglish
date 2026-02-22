// Message types for Chrome extension communication

import type { OutputFormat } from '@ingglish/phonemes';

export type ExtensionMessage =
  | GetFormatMessage
  | GetStateMessage
  | RestoreMessage
  | RetranslateMessage
  | SetFormatMessage
  | ToggleMessage
  | TranslateMessage
  | TranslateWordsMessage;

export interface FormatResponse {
  format: OutputFormat;
}

export interface GetFormatMessage {
  type: 'GET_FORMAT';
}

export interface GetStateMessage {
  type: 'GET_STATE';
}

export interface RestoreMessage {
  type: 'RESTORE';
}

export interface RetranslateMessage {
  format: OutputFormat;
  type: 'RETRANSLATE';
}

export interface SetFormatMessage {
  format: OutputFormat;
  type: 'SET_FORMAT';
}

export interface StateResponse {
  enabled: boolean;
  format?: OutputFormat;
}

export interface ToggleMessage {
  type: 'TOGGLE';
}

export interface ToggleResponse {
  enabled?: boolean;
  error?: string;
  success: boolean;
}

export interface TranslateMessage {
  type: 'TRANSLATE';
}

export interface TranslateResponse {
  error?: string;
  success: boolean;
}

// Batch translate words (for lightweight content script)
export interface TranslateWordsMessage {
  format: OutputFormat;
  type: 'TRANSLATE_WORDS';
  words: string[];
}

// Response for batch translation
export interface TranslateWordsResponse {
  translations: Record<string, string>;
}
