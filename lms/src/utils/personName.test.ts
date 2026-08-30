import {describe, expect, it} from 'vitest';
import {formatAccountName, formatPersonName, parsePersonName} from './personName';

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

describe('parsePersonName', () => {
  it('uses the last word as lastName and all preceding words as firstName', () => {
    expect(parsePersonName('Mary Jane Watson')).toEqual({firstName: 'Mary Jane', lastName: 'Watson'});
  });

  it('normalizes surrounding and repeated whitespace', () => {
    expect(parsePersonName('  Alex   Rivera  ')).toEqual({firstName: 'Alex', lastName: 'Rivera'});
  });

  it('rejects a single-word name because both fields are required', () => {
    expect(parsePersonName('Prince')).toBeNull();
    expect(parsePersonName('  ')).toBeNull();
  });
});
