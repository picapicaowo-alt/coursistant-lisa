export interface PersonNameParts {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}

export interface PersonNameInput {
  firstName: string;
  middleName: string;
  lastName: string;
}

export interface NormalizedPersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
}

export const PERSON_NAME_PART_MAX_LENGTH = 100;

export const emptyPersonNameInput = (): PersonNameInput => ({
  firstName: '',
  middleName: '',
  lastName: '',
});

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

/**
 * Keeps read compatibility while Dev and Prod return different roster
 * contracts. Structured fields are authoritative; legacyName is display-only
 * and must never be parsed back into first/middle/last name writes.
 */
export const formatPersonNameWithLegacyFallback = (
  parts: PersonNameParts,
  legacyName?: string | null,
): string => (
  formatPersonName(parts) || normalizeNamePart(legacyName)
);

/**
 * Mirrors the API's per-part validation without guessing how a full name
 * should be split. Whitespace-only middle names are valid and mean "empty".
 */
export const isPersonNameInputValid = ({firstName, middleName, lastName}: PersonNameInput): boolean => {
  const normalizedFirstName = normalizeNamePart(firstName);
  const normalizedMiddleName = normalizeNamePart(middleName);
  const normalizedLastName = normalizeNamePart(lastName);

  return normalizedFirstName.length >= 1
    && normalizedFirstName.length <= PERSON_NAME_PART_MAX_LENGTH
    && normalizedMiddleName.length <= PERSON_NAME_PART_MAX_LENGTH
    && normalizedLastName.length >= 1
    && normalizedLastName.length <= PERSON_NAME_PART_MAX_LENGTH;
};

/**
 * Builds a write payload from explicit inputs. Profile edits include an empty
 * middleName so users can deliberately clear a previously stored value.
 */
export const normalizePersonNameInput = (
  {firstName, middleName, lastName}: PersonNameInput,
  options: {includeEmptyMiddleName?: boolean} = {},
): NormalizedPersonName => {
  const normalizedMiddleName = normalizeNamePart(middleName);
  return {
    firstName: normalizeNamePart(firstName),
    ...(normalizedMiddleName || options.includeEmptyMiddleName ? {middleName: normalizedMiddleName} : {}),
    lastName: normalizeNamePart(lastName),
  };
};
