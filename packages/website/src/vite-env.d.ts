/// <reference types="vite/client" />

// Markdown files are converted to HTML at build time by vite-plugin-md
declare module '*.md' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_CORS_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
