import {describe, expect, it} from 'vitest';
import {
  getApiErrorCode,
  getApiErrorMessage,
  getHttpStatusDescription,
  isApiError,
  isConflict,
  isHttpStatus,
  isMethodNotAllowed,
  isNotFound,
  isTransportOrServerFailure,
} from './apiError';

describe('apiError helpers', () => {
  it('reads envelope codes without treating a transport failure as a domain code', () => {
    expect(getApiErrorCode({code: 400, message: 'Bad request', details: {code: 'INVALID_VERIFICATION_CODE'}}))
      .toBe('INVALID_VERIFICATION_CODE');
    expect(getApiErrorCode(new Error('network'))).toBeUndefined();
    expect(isHttpStatus({code: 404, message: 'missing'}, 404)).toBe(true);
    expect(isNotFound({code: 404, message: 'missing'})).toBe(true);
    expect(isMethodNotAllowed({code: 405, message: 'method not allowed'})).toBe(true);
    expect(isConflict({code: 409, message: 'conflict'})).toBe(true);
    expect(isTransportOrServerFailure({code: 500, message: 'server error'})).toBe(true);
    expect(isApiError({code: 'SUCCESS'})).toBe(false);
  });

  it('prefers a safe details message and otherwise keeps the caller fallback', () => {
    expect(getApiErrorMessage({code: 400, message: 'Bad request', details: {message: 'Code expired'}}, 'Fallback'))
      .toBe('Code expired');
    expect(getApiErrorMessage({code: 0, message: 'Network Error'}, 'Could not save.')).toBe('Network Error');
    expect(getApiErrorMessage('not-an-error', 'Could not save.')).toBe('Could not save.');
  });

  it('provides sensible human descriptions for HTTP status codes', () => {
    expect(getHttpStatusDescription({code: 404, message: 'Not found'})).toMatch(/not found/i);
    expect(getHttpStatusDescription({code: 405, message: 'Not allowed'})).toMatch(/not supported/i);
    expect(getHttpStatusDescription({code: 409, message: 'Conflict'})).toMatch(/conflict/i);
    expect(getHttpStatusDescription({code: 500, message: 'Error'})).toMatch(/unexpected server error/i);
  });
});
