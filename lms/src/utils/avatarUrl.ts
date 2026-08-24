const buildConfiguredApiOrigin = (): string | null => {
  const configuredApi = import.meta.env.VITE_API_DOMAIN_NAME;

  if (/^https?:\/\//i.test(configuredApi)) {
    try {
      return new URL(configuredApi).origin;
    } catch {
      return null;
    }
  }

  const protocol = import.meta.env.VITE_BASE_PROTOCOL;
  const hostname = import.meta.env.VITE_BASE_DOMAIN;
  const port = import.meta.env.VITE_BASE_PORT;
  if (!protocol || !hostname) return null;

  return `${protocol}://${hostname}${port ? `:${port}` : ""}`;
};

/**
 * Login currently returns public avatar URLs without the dev API port. Rewrite
 * only URLs belonging to our configured API host; third-party avatar URLs are
 * deliberately left untouched.
 */
export const normalizeAvatarUrl = (
  avatar: string | null | undefined,
  configuredOrigin = buildConfiguredApiOrigin(),
): string | null => {
  const value = avatar?.trim();
  if (!value || !configuredOrigin) return value || null;

  try {
    const targetOrigin = new URL(configuredOrigin);
    const avatarUrl = new URL(value, targetOrigin);

    if (avatarUrl.hostname !== targetOrigin.hostname) return value;

    avatarUrl.protocol = targetOrigin.protocol;
    avatarUrl.port = targetOrigin.port;
    return avatarUrl.toString();
  } catch {
    return value;
  }
};
