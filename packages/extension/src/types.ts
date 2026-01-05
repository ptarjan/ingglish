// Message types for Chrome extension communication

export interface GetStateMessage {
  type: 'GET_STATE';
}

export interface ToggleMessage {
  type: 'TOGGLE';
}

export interface TranslateMessage {
  type: 'TRANSLATE';
}

export type ExtensionMessage = GetStateMessage | ToggleMessage | TranslateMessage;

export interface StateResponse {
  enabled: boolean;
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
