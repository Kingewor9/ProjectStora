/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_ADSGRAM_BLOCK_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
