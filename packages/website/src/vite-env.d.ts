/// <reference types="vite/client" />

// React testing environment flag
declare let IS_REACT_ACT_ENVIRONMENT: boolean;

// Markdown files are converted to HTML at build time by vite-plugin-md
declare module '*.md' {
  const content: string;
  export default content;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly VITE_CORS_PROXY_URL?: string;
}
