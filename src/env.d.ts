/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API server, without /api. Set in .env.development / .env.production. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
