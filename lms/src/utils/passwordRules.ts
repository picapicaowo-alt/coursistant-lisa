/** Matches the backend PasswordValidator: at least 8 characters, one letter, one digit. */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const isValidPassword = (value: string): boolean => PASSWORD_PATTERN.test(value);
