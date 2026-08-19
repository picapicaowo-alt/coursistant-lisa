import {describe, expect, it} from 'vitest';
import {getApiErrorCode, getApiErrorMessage, isApiError, isHttpStatus} from './apiError';

describe('apiError helpers', () => {
  it('reads envelope codes without treating a transport failure as a domain code', () => {
    expect(getApiErrorCode({code: 400, message: 'Bad request', details: {code: 'INVALID_VERIFICATION_CODE'}}))
      .toBe('INVALID_VERIFICATION_CODE');
    expect(getApiErrorCode(new Error('network'))).toBeUndefined();
    expect(isHttpStatus({code: 404, message: 'missing'}, 404)).toBe(true);
    expect(isApiError({code: 'SUCCESS'})).toBe(false);
  });

  it('prefers a safe details message and otherwise keeps the caller fallback', () => {
    expect(getApiErrorMessage({code: 400, message: 'Bad request', details: {message: 'Code expired'}}, 'Fallback'))
      .toBe('Code expired');
    expect(getApiErrorMessage({code: 0, message: 'Network Error'}, 'Could not save.')).toBe('Network Error');
    expect(getApiErrorMessage('not-an-error', 'Could not save.')).toBe('Could not save.');
  });
});
