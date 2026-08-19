import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import MediaInsertDialog from './MediaInsertDialog';

const fileInput = () => document.body.querySelector('input[type="file"]') as HTMLInputElement;

describe('MediaInsertDialog', () => {
  it('shows stacked choose-files and drag-here zones instead of a URL prompt', () => {
    render(<MediaInsertDialog kind="image" onClose={vi.fn()} onInsert={vi.fn()}/>);

    expect(screen.getByRole('dialog', {name: 'Insert image'})).not.toBeNull();
    expect(screen.getByRole('button', {name: /Choose files/})).not.toBeNull();
    expect(screen.getByRole('button', {name: /Drag files here/})).not.toBeNull();
  });

  it('opens the file picker from the top box and inserts the chosen image', async () => {
    const onInsert = vi.fn();
    render(<MediaInsertDialog kind="image" onClose={vi.fn()} onInsert={onInsert}/>);
    const input = fileInput();
    expect(input).not.toBeNull();
    let opened = false;
    input.click = () => {
      opened = true;
    };

    fireEvent.click(screen.getByRole('button', {name: /Choose files/}));
    expect(opened).toBe(true);

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [new File(['png-bytes'], 'announcement.png', {type: 'image/png'})],
    });
    fireEvent.change(input);

    await waitFor(() => {
      expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'announcement.png',
        url: expect.stringMatching(/^data:image\/png;base64,/),
      }));
    });
  });

  it('inserts a dropped file from the bottom box', async () => {
    const onInsert = vi.fn();
    render(<MediaInsertDialog kind="file" onClose={vi.fn()} onInsert={onInsert}/>);

    fireEvent.drop(screen.getByRole('button', {name: /Drag files here/}), {
      dataTransfer: {files: [new File(['%PDF'], 'brief.pdf', {type: 'application/pdf'})]},
    });

    await waitFor(() => {
      expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'brief.pdf',
        url: expect.stringMatching(/^data:application\/pdf;base64,/),
      }));
    });
  });

  it('explains why an unsupported file is rejected', async () => {
    render(<MediaInsertDialog kind="image" onClose={vi.fn()} onInsert={vi.fn()}/>);

    fireEvent.drop(screen.getByRole('button', {name: /Drag files here/}), {
      dataTransfer: {files: [new File(['nope'], 'notes.txt', {type: 'text/plain'})]},
    });

    expect((await screen.findByRole('alert')).textContent).toMatch(/PNG, JPEG, GIF, or WebP/i);
  });
});
