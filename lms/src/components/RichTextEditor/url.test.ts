import {describe, expect, it} from 'vitest';
import {normalizeSafeUrl, normalizeTextColor} from './url';

describe('rich text content safety', () => {
  it('accepts supported links and normalizes common web addresses', () => {
    expect(normalizeSafeUrl('www.example.com/file.pdf')).toBe('https://www.example.com/file.pdf');
    expect(normalizeSafeUrl('/course/12', {allowRelative: true})).toBe('/course/12');
    expect(normalizeSafeUrl('mailto:teacher@example.com')).toBe('mailto:teacher@example.com');
  });

  it('rejects script URLs and non-web media sources', () => {
    expect(normalizeSafeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeSafeUrl('data:text/html,bad', {mediaOnly: true})).toBeNull();
    expect(normalizeSafeUrl('mailto:teacher@example.com', {mediaOnly: true})).toBeNull();
  });

  it('allows only bounded CSS color formats', () => {
    expect(normalizeTextColor('#566FE8')).toBe('#566FE8');
    expect(normalizeTextColor('rgb(86, 111, 232)')).toBe('rgb(86, 111, 232)');
    expect(normalizeTextColor('red; background: url(bad)')).toBeNull();
  });
});
