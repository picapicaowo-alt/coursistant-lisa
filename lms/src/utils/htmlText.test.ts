import {describe, expect, it} from 'vitest';
import {htmlToPlainText} from './htmlText';

describe('htmlToPlainText', () => {
  it('unwraps the escaped paragraph the grading dialog stores', () => {
    expect(htmlToPlainText('<p>Clearer thesis &amp; citations.</p>')).toBe('Clearer thesis & citations.');
  });
});
