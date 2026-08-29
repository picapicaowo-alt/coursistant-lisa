export interface PersonNameParts {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}

const normalizeNamePart = (value?: string | null): string => value?.trim() ?? '';

/** Builds the UI display name from the structured person-name contract. */
export const formatPersonName = ({firstName, middleName, lastName}: PersonNameParts): string => (
  [firstName, middleName, lastName]
    .map(normalizeNamePart)
    .filter(Boolean)
    .join(' ')
);

export interface AccountNameParts extends PersonNameParts {
  adminName?: string | null;
}

/** Administrators use adminName; user accounts use structured person fields. */
export const formatAccountName = (parts: AccountNameParts): string => (
  normalizeNamePart(parts.adminName) || formatPersonName(parts)
);

export interface ParsedPersonName {
  firstName: string;
  lastName: string;
}

/**
 * Converts the product's single full-name input into the API contract.
 * The final whitespace-delimited word is the family name; every preceding
 * word stays together as the given name. A one-word value is incomplete.
 */
export const parsePersonName = (value: string): ParsedPersonName | null => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;

  const lastName = words[words.length - 1];
  if (!lastName) return null;

  return {
    firstName: words.slice(0, -1).join(' '),
    lastName,
  };
};
