import {Editor} from '@tiptap/core';
import {describe, expect, it} from 'vitest';
import {createEditorExtensions, extensionNames} from './extensions';

describe('RichTextEditor extensions', () => {
  const names = extensionNames(createEditorExtensions({placeholder: 'test', disabled: false}));

  it('registers every extension once', () => {
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
  });

  it('keeps the formatting exposed by the toolbar', () => {
    ['bold', 'italic', 'underline', 'strike', 'heading', 'bulletList', 'orderedList', 'link', 'textColor', 'richImage', 'richVideo', 'inlineMath', 'blockMath']
      .forEach(required => expect(names).toContain(required));
  });

  it('parses and serializes Markdown, code, and TeX without leaving the editing surface', () => {
    const source = [
      '**Markdown bold**',
      '',
      'Inline code: `const square = (x) => x * x;`',
      '',
      '```js',
      'function add(a, b) {',
      '  return a + b;',
      '}',
      '```',
      '',
      'Inline math: $E = mc^2$',
      '',
      '$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$',
    ].join('\n');

    const editor = new Editor({
      content: source,
      contentType: 'markdown',
      extensions: createEditorExtensions({placeholder: 'test', disabled: false}),
    });

    expect(editor.getHTML()).toContain('<strong>Markdown bold</strong>');
    expect(editor.getHTML()).toContain('<code>const square = (x) =&gt; x * x;</code>');
    expect(editor.getJSON().content?.some(node => node.type === 'codeBlock')).toBe(true);
    expect(editor.getHTML()).toContain('data-type="inline-math"');
    expect(editor.getHTML()).toContain('data-type="block-math"');
    expect(editor.getMarkdown()).toContain('$E = mc^2$');
    expect(editor.getMarkdown()).toContain('$$\n\\int_0^1 x^2\\,dx = \\frac{1}{3}\n$$');
    editor.destroy();
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
