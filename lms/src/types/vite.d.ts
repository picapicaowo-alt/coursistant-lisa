/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_API_DOMAIN_NAME: string;
  readonly VITE_COURSE_API_DOMAIN_NAME: string;
  readonly VITE_ASSIGNMENT_API_DOMAIN_NAME: string;
  readonly VITE_SIGNUP_API_DOMAIN_NAME: string;
  readonly VITE_AI_AGENT_API_DOMAIN_NAME: string;
  readonly VITE_STUDY_SUPPORT_API_DOMAIN_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_GIT_SHA: string;
  readonly VITE_RELEASE_DIRTY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
