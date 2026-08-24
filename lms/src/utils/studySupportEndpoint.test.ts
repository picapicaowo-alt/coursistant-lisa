import {describe, expect, it} from 'vitest';
import {buildStudySupportEndpoint} from './studySupportEndpoint';

describe('buildStudySupportEndpoint', () => {
  it('routes Study Support paths through its dedicated same-origin prefix', () => {
    expect(buildStudySupportEndpoint('/query', '/study-support')).toBe('/study-support/api/query');
    expect(buildStudySupportEndpoint('dialogue/selectById/12', '/study-support/'))
      .toBe('/study-support/api/dialogue/selectById/12');
  });

  it('does not duplicate an agent base that already includes /api', () => {
    expect(buildStudySupportEndpoint('/query/stream', 'https://agent.example/api/'))
      .toBe('https://agent.example/api/query/stream');
  });

  it('uses the same-origin Study Support prefix when the environment is absent', () => {
    expect(buildStudySupportEndpoint('/query', undefined)).toBe('/study-support/api/query');
  });
});
