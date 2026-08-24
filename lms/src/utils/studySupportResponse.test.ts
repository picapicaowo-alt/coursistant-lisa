import {describe, expect, it} from 'vitest';
import {readStudySupportAnswer} from './studySupportResponse';

describe('readStudySupportAnswer', () => {
  it('returns a non-empty answer from the Study Support envelope', () => {
    expect(readStudySupportAnswer({data: {answer: '  Photosynthesis stores light energy.  '}}))
      .toBe('Photosynthesis stores light energy.');
  });

  it('returns the direct answer payload used by the streaming endpoint', () => {
    expect(readStudySupportAnswer({answer: '  The streamed answer.  '}))
      .toBe('The streamed answer.');
  });

  it.each([
    undefined,
    null,
    {},
    {data: null},
    {data: {}},
    {data: {answer: '   '}},
  ])('rejects an empty or malformed response (%j)', response => {
    expect(() => readStudySupportAnswer(response))
      .toThrow('Study Support returned an empty response.');
  });
});
