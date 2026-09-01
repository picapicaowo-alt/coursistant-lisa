import {describe, expect, it} from 'vitest';
import {
  formatAccountName,
  formatPersonName,
  formatPersonNameWithLegacyFallback,
  isPersonNameInputValid,
  normalizePersonNameInput,
} from './personName';

describe('formatPersonName', () => {
  it('joins only populated structured fields', () => {
    expect(formatPersonName({firstName: 'Alex', middleName: null, lastName: 'Rivera'})).toBe('Alex Rivera');
    expect(formatPersonName({firstName: null, middleName: null, lastName: null})).toBe('');
  });

  it('trims name parts supplied by the API', () => {
    expect(formatPersonName({firstName: '  Jingyuan ', middleName: ' ', lastName: ' Zhuang '})).toBe('Jingyuan Zhuang');
  });
});

describe('formatAccountName', () => {
  it('uses adminName for administrator accounts', () => {
    expect(formatAccountName({adminName: 'System Admin'})).toBe('System Admin');
  });

  it('uses structured fields for user accounts', () => {
    expect(formatAccountName({firstName: 'Alex', lastName: 'Rivera'})).toBe('Alex Rivera');
  });
});

describe('formatPersonNameWithLegacyFallback', () => {
  it('prefers structured fields when both contracts are present', () => {
    expect(formatPersonNameWithLegacyFallback(
      {firstName: 'New', lastName: 'Contract'},
      'Legacy Name',
    )).toBe('New Contract');
  });

  it('uses the legacy display value without parsing it when structured fields are absent', () => {
    expect(formatPersonNameWithLegacyFallback(
      {firstName: null, middleName: null, lastName: null},
      '  Young Cho  ',
    )).toBe('Young Cho');
  });
});

describe('structured person-name inputs', () => {
  it('preserves the three explicit fields without guessing name boundaries', () => {
    expect(normalizePersonNameInput({firstName: ' Mary Jane ', middleName: ' Ann ', lastName: ' Watson '}))
      .toEqual({firstName: 'Mary Jane', middleName: 'Ann', lastName: 'Watson'});
  });

  it('omits an empty optional middle name for create requests', () => {
    expect(normalizePersonNameInput({firstName: 'Alex', middleName: ' ', lastName: 'Rivera'}))
      .toEqual({firstName: 'Alex', lastName: 'Rivera'});
  });

  it('includes an empty middle name when a profile edit must clear it', () => {
    expect(normalizePersonNameInput(
      {firstName: 'Alex', middleName: ' ', lastName: 'Rivera'},
      {includeEmptyMiddleName: true},
    )).toEqual({firstName: 'Alex', middleName: '', lastName: 'Rivera'});
  });

  it('requires first and last name and enforces the API length limit per field', () => {
    expect(isPersonNameInputValid({firstName: 'Alex', middleName: '', lastName: 'Rivera'})).toBe(true);
    expect(isPersonNameInputValid({firstName: '', middleName: '', lastName: 'Rivera'})).toBe(false);
    expect(isPersonNameInputValid({firstName: 'Alex', middleName: '', lastName: 'x'.repeat(101)})).toBe(false);
  });
});
