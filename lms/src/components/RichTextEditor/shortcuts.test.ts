import {afterEach, describe, expect, it} from 'vitest';
import {Editor} from '@tiptap/core';
import {createEditorExtensions} from './extensions';

// prosemirror-keymap resolves "Mod-" to Meta on Apple platforms and Ctrl everywhere else,
// so a synthetic event has to use the same modifier the keymap is registered under.
const usesMetaKey = /Mac|iP(hone|[oa]d)/.test(navigator.platform);

let editor: Editor | null = null;

const mountEditor = (content: string) => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  editor = new Editor({
    element,
    content,
    extensions: createEditorExtensions({placeholder: 'test', disabled: false}),
  });
  return editor;
};

const press = (instance: Editor, key: string, {shift = false} = {}) => {
  instance.view.dom.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    metaKey: usesMetaKey,
    ctrlKey: !usesMetaKey,
    shiftKey: shift,
    bubbles: true,
    cancelable: true,
  }));
};

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.innerHTML = '';
});

describe('RichTextEditor keyboard shortcuts', () => {
  it.each([
    ['b', 'bold'],
    ['i', 'italic'],
    ['u', 'underline'],
  ])('toggles %s exactly once per Mod-%s press', (key, mark) => {
    const instance = mountEditor('<p>hello</p>');
    instance.commands.setTextSelection({from: 1, to: 6});

    press(instance, key);
    expect(instance.isActive(mark)).toBe(true);

    press(instance, key);
    expect(instance.isActive(mark)).toBe(false);
  });

  it('toggles strikethrough with Mod-Shift-s', () => {
    const instance = mountEditor('<p>hello</p>');
    instance.commands.setTextSelection({from: 1, to: 6});

    press(instance, 's', {shift: true});
    expect(instance.isActive('strike')).toBe(true);
  });

  it('toggles lists with Mod-Shift-8 and Mod-Shift-7', () => {
    const instance = mountEditor('<p>hello</p>');
    instance.commands.setTextSelection({from: 1, to: 6});

    press(instance, '8', {shift: true});
    expect(instance.isActive('bulletList')).toBe(true);

    press(instance, '7', {shift: true});
    expect(instance.isActive('orderedList')).toBe(true);
  });

  it('leaves Mod-k unbound so the editor can own the link prompt', () => {
    const instance = mountEditor('<p>hello</p>');
    instance.commands.setTextSelection({from: 1, to: 6});

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: usesMetaKey,
      ctrlKey: !usesMetaKey,
      bubbles: true,
      cancelable: true,
    });
    instance.view.dom.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
