import {describe, expect, it} from 'vitest';
import {createEditorExtensions, extensionNames} from './extensions';

describe('RichTextEditor extensions', () => {
  const names = extensionNames(createEditorExtensions({placeholder: 'test', disabled: false}));

  it('registers every extension once', () => {
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
  });

  it('keeps the formatting exposed by the toolbar', () => {
    ['bold', 'italic', 'underline', 'strike', 'heading', 'bulletList', 'orderedList', 'link', 'textColor', 'richImage', 'richVideo']
      .forEach(required => expect(names).toContain(required));
  });
});
