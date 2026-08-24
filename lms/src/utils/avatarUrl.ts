import {getAppEnv} from '@/config/env';

const buildConfiguredApiOrigin = (): string | null => {
  if (typeof window === 'undefined') return null;
  return new URL(getAppEnv().apiBase, window.location.origin).origin;
};

/**
 * Resolve backend-owned avatars through the current deployment origin. This
 * keeps Dev and Prod on the same artifact while preserving external avatars.
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
