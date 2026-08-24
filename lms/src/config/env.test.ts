import {describe, expect, it} from 'vitest';
import {normalizeSameOriginPath} from './env';

describe('normalizeSameOriginPath', () => {
  it('normalizes a configured same-origin path', () => {
    expect(normalizeSameOriginPath('API', ' /api/ ', '/fallback')).toBe('/api');
  });

  it('uses the invariant fallback when no value is configured', () => {
    expect(normalizeSameOriginPath('API', undefined, '/api')).toBe('/api');
  });

  it.each(['https://api.example.test', '//api.example.test', 'api'])(
    'rejects browser configuration that can escape the deployment origin: %s',
    value => {
      expect(() => normalizeSameOriginPath('API', value, '/api')).toThrow(
        'API must be a same-origin path',
      );
    },
  );
});
