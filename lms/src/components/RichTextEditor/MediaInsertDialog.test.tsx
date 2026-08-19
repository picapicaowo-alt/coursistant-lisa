import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import MediaInsertDialog from './MediaInsertDialog';

const fileInput = () => document.body.querySelector('input[type="file"]') as HTMLInputElement;

describe('MediaInsertDialog', () => {
  it('shows stacked choose-files and drag-here zones for images and files', () => {
    render(<MediaInsertDialog onClose={vi.fn()} onInsert={vi.fn()}/>);

    expect(screen.getByRole('dialog', {name: 'Insert file'})).not.toBeNull();
    expect(screen.getByRole('button', {name: /Choose files/})).not.toBeNull();
    expect(screen.getByRole('button', {name: /Drag files here/})).not.toBeNull();
  });

  it('opens the file picker from the top box and inserts the chosen image', async () => {
    const onInsert = vi.fn();
    render(<MediaInsertDialog onClose={vi.fn()} onInsert={onInsert}/>);
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
        kind: 'image',
        name: 'announcement.png',
        url: expect.stringMatching(/^data:image\/png;base64,/),
      }));
    });
  });

  it('inserts a dropped PDF from the same dialog', async () => {
    const onInsert = vi.fn();
    render(<MediaInsertDialog onClose={vi.fn()} onInsert={onInsert}/>);

    fireEvent.drop(screen.getByRole('button', {name: /Drag files here/}), {
      dataTransfer: {files: [new File(['%PDF'], 'brief.pdf', {type: 'application/pdf'})]},
    });

    await waitFor(() => {
      expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({
        kind: 'file',
        name: 'brief.pdf',
        url: expect.stringMatching(/^data:application\/pdf;base64,/),
      }));
    });
  });

  it('explains why an unsupported file is rejected', async () => {
    render(<MediaInsertDialog onClose={vi.fn()} onInsert={vi.fn()}/>);

    fireEvent.drop(screen.getByRole('button', {name: /Drag files here/}), {
      dataTransfer: {files: [new File(['nope'], 'page.html', {type: 'text/html'})]},
    });

    expect((await screen.findByRole('alert')).textContent).toMatch(/image, video, PDF, Office document, ZIP, or text file/i);
  });
});
