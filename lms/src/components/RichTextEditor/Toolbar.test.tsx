import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Editor} from '@tiptap/core';
import {afterEach, describe, expect, it} from 'vitest';
import {createEditorExtensions} from './extensions';
import Toolbar from './Toolbar';

let editor: Editor | null = null;

const mountToolbar = () => {
  editor = new Editor({
    extensions: createEditorExtensions({placeholder: 'test', disabled: false}),
  });
  render(<Toolbar editor={editor}/>);
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('RichTextEditor insert menu', () => {
  it('opens the shared file-and-image upload dialog from Image, Video, and File', async () => {
    const user = userEvent.setup();
    mountToolbar();

    await user.click(screen.getByText('Insert'));
    await user.click(screen.getByRole('button', {name: 'Image'}));
    expect(screen.getByRole('dialog', {name: 'Insert file'})).not.toBeNull();
    expect(screen.getByRole('button', {name: /Choose files/})).not.toBeNull();
    expect(screen.getByRole('button', {name: /Drag files here/})).not.toBeNull();

    await user.click(screen.getByRole('button', {name: 'Close'}));
    await user.click(screen.getByText('Insert'));
    await user.click(screen.getByRole('button', {name: 'File'}));
    expect(screen.getByRole('dialog', {name: 'Insert file'})).not.toBeNull();
  });
});
