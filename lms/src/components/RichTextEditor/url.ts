const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const LINK_PROTOCOLS = new Set([...HTTP_PROTOCOLS, 'mailto:']);

const prepareUrl = (value: string) => {
  const trimmed = value.trim();
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
};

export const normalizeSafeUrl = (
  value: string,
  options: {mediaOnly?: boolean; allowRelative?: boolean} = {},
): string | null => {
  const prepared = prepareUrl(value);
  if (!prepared) return null;

  if (options.allowRelative && (/^\/(?!\/)/.test(prepared) || /^#[\w-]+$/.test(prepared))) {
    return prepared;
  }

  try {
    const parsed = new URL(prepared);
    const protocols = options.mediaOnly ? HTTP_PROTOCOLS : LINK_PROTOCOLS;
    return protocols.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};

export const normalizeTextColor = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const color = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(color)) return color;
  if (/^rgba?\(\s*[\d.]+%?(?:\s*,\s*[\d.]+%?){2}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/i.test(color)) {
    return color;
  }
  return null;
};
