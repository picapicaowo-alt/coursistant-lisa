/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_BASE_PROTOCOL: string;
  readonly VITE_BASE_DOMAIN: string;
  readonly VITE_BASE_PORT: string;
  readonly VITE_BASE_PATH: string;
  readonly VITE_STATIC_BASE_URL: string;
  readonly VITE_API_DOMAIN_NAME: string;
  readonly VITE_COURSE_API_DOMAIN_NAME: string;
  readonly VITE_ASSIGNMENT_API_DOMAIN_NAME: string;
  readonly VITE_SIGNUP_API_DOMAIN_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
