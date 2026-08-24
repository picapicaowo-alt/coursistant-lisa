import {describe, expect, it} from 'vitest';
import type {ApiResponse} from './common';
import {unwrapData} from './common';

const noPayloadResponse: ApiResponse<void> = {
  status: 200,
  code: 'SUCCESS',
  data: null,
  message: 'Success',
  timestamp: '2026-08-23T00:00:00Z',
};

describe('ApiResponse', () => {
  it('accepts explicit data null for a successful no-payload endpoint', () => {
    expect(noPayloadResponse.data).toBeNull();
  });

  it('throws when a payload-consuming caller unwraps data null', () => {
    expect(() => unwrapData(noPayloadResponse, 'payload-required operation'))
      .toThrow('payload-required operation: response had no data');
  });
});
