import {Editor} from '@tiptap/core';
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

  it('keeps uploaded file data URLs on links and rejects HTML payloads', () => {
    const editor = new Editor({
      content: '<p>brief.pdf</p>',
      extensions: createEditorExtensions({placeholder: 'test', disabled: false}),
    });
    const pdf = 'data:application/pdf;base64,JVBERi0=';
    editor.commands.setTextSelection({from: 1, to: 10});
    expect(editor.commands.setLink({href: pdf, target: '_blank'})).toBe(true);
    expect(editor.getHTML()).toContain(`href="${pdf}"`);

    editor.commands.unsetLink();
    expect(editor.commands.setLink({href: 'data:text/html;base64,PHNjcmlwdD4='})).toBe(false);
    expect(editor.getHTML()).not.toMatch(/<a[^>]+href="data:text\/html/);
    editor.destroy();
  });
});
