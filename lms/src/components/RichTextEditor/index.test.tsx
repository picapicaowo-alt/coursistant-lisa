import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import {describe, expect, it, vi} from 'vitest';
import {RichTextEditor} from './index';

describe('RichTextEditor inline Markdown authoring', () => {
  it('formats a Markdown/code/TeX document inside the editable surface', async () => {
    const onChange = vi.fn();
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

    const {container} = render(
      <RichTextEditor
        content={source}
        onChange={onChange}
        showToolbar={false}
        ariaLabel="Engineering answer"
      />,
    );
    await screen.findByLabelText('Engineering answer');

    await waitFor(() => {
      expect(container.querySelector('strong')).toHaveTextContent('Markdown bold');
      expect(container.querySelector('code:not(pre code)')).toHaveTextContent('const square');
      expect(container.querySelector('pre code')).toHaveTextContent('function add');
      expect(container.querySelector('[data-type="inline-math"]')).toHaveAttribute('data-latex', 'E = mc^2');
      expect(container.querySelector('[data-type="block-math"]')).toHaveAttribute('data-latex', '\\int_0^1 x^2\\,dx = \\frac{1}{3}');
    });

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    if (onChange.mock.calls.length) {
      expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('$E = mc^2$'));
    }
  });

  it('turns a typed code fence into a multiline code block before Enter-to-submit', async () => {
    const onSubmit = vi.fn();
    const {container} = render(
      <RichTextEditor
        content="<p>```js</p>"
        onSubmit={onSubmit}
        showToolbar={false}
        ariaLabel="Code composer"
      />,
    );
    const editor = await screen.findByLabelText('Code composer');

    fireEvent.keyDown(editor, {key: 'Enter'});

    await waitFor(() => {
      expect(container.querySelector('pre code')).toHaveClass('language-js');
      expect(container.querySelector('pre code')).toHaveTextContent('');
    });
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(editor, {key: 'Enter'});
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
