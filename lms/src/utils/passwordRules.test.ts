import {describe, expect, it} from 'vitest';
import {isValidPassword} from './passwordRules';

describe('isValidPassword', () => {
  it('accepts the backend letter-and-digit rule', () => {
    expect(isValidPassword('Passw0rd1')).toBe(true);
    expect(isValidPassword('passwordonly')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
    expect(isValidPassword('Ab1')).toBe(false);
  });
});
