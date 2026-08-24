const DEFAULT_STUDY_SUPPORT_BASE = '/study-support';

export const buildStudySupportEndpoint = (
  path: string,
  studySupportBase: string | undefined,
): string => {
  const normalizedBase = (studySupportBase?.trim() || DEFAULT_STUDY_SUPPORT_BASE).replace(/\/+$/, '');
  const apiBase = normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
};

export const studySupportEndpoint = (path: string): string =>
  buildStudySupportEndpoint(path, import.meta.env.VITE_STUDY_SUPPORT_API_DOMAIN_NAME);
