export const normalizeSameOriginPath = (name: string, value: string | undefined, fallback: string): string => {
  const path = value?.trim() || fallback;
  if (!/^\/(?!\/)/.test(path)) {
    throw new Error(`${name} must be a same-origin path beginning with one slash.`);
  }
  return path.replace(/\/$/, '') || '/';
};

export interface AppEnv {
  apiBase: string;
  agentBase: string;
  studySupportBase: string;
  release: string;
  gitSha: string;
  dirty: boolean;
}

let cached: AppEnv | undefined;

/**
 * Public configuration is intentionally same-origin in every environment.
 * Upstream hosts belong to the serving proxy and must never enter the bundle.
 */
export const getAppEnv = (): AppEnv => {
  if (cached) return cached;

  cached = {
    apiBase: normalizeSameOriginPath('VITE_API_DOMAIN_NAME', import.meta.env.VITE_API_DOMAIN_NAME, '/api'),
    agentBase: normalizeSameOriginPath('VITE_AI_AGENT_API_DOMAIN_NAME', import.meta.env.VITE_AI_AGENT_API_DOMAIN_NAME, '/ai-agent'),
    studySupportBase: normalizeSameOriginPath(
      'VITE_STUDY_SUPPORT_API_DOMAIN_NAME',
      import.meta.env.VITE_STUDY_SUPPORT_API_DOMAIN_NAME,
      '/study-support',
    ),
    release: import.meta.env.VITE_APP_VERSION?.trim() || 'local',
    gitSha: import.meta.env.VITE_GIT_SHA?.trim() || 'local',
    dirty: import.meta.env.VITE_RELEASE_DIRTY === 'true',
  };
  return cached;
};
