import {render, screen} from '@testing-library/react';
import '@testing-library/jest-dom';
import {describe, expect, it} from 'vitest';
import MarkdownMessage from './MarkdownMessage';

describe('MarkdownMessage', () => {
  it('renders CommonMark, GFM, fenced code, and TeX math together', () => {
    const content = [
      '# Formatting',
      '',
      '**Bold** and ~~removed~~',
      '',
      '- [x] GFM task',
      '',
      '| Name | Value |',
      '| --- | ---: |',
      '| answer | 42 |',
      '',
      '[Documentation](https://example.com/docs)',
      '',
      'Inline code: `const square = (x) => x * x;`',
      '',
      '```ts',
      'const answer: number = 42;',
      '```',
      '',
      'Inline math: $E = mc^2$',
      '',
      '$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$',
    ].join('\n');

    const {container} = render(<MarkdownMessage content={content}/>);

    expect(screen.getByRole('heading', {name: 'Formatting'})).toBeInTheDocument();
    expect(screen.getByText('Bold').tagName).toBe('STRONG');
    expect(screen.getByText('removed').tagName).toBe('DEL');
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.getByRole('table')).toBeInTheDocument();

    const link = screen.getByRole('link', {name: 'Documentation'});
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    const codeBlock = container.querySelector('code.language-ts');
    expect(codeBlock).toHaveTextContent('const answer: number = 42;');
    expect(codeBlock).not.toHaveTextContent(/^ts/);
    expect(container.querySelectorAll('.katex')).toHaveLength(2);
  });

  it('does not render raw HTML from chat messages', () => {
    const {container} = render(
      <MarkdownMessage content={'<script>window.compromised = true</script>\n\n**Safe**'}/>,
    );

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(screen.getByText('Safe').tagName).toBe('STRONG');
  });
});
