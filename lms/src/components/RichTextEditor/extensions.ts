import {Extension} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {Markdown} from 'tiptap-markdown';
import {BlankNode} from './extensions/BlankNode';
import {RichImage, RichVideo, TextColor} from './extensions/RichContent';
import styles from './index.module.scss';

// StarterKit binds Mod-* shortcuts for marks and headings but ships none for lists.
export const ListShortcuts = Extension.create({
  name: 'listShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-8': () => this.editor.commands.toggleBulletList(),
      'Mod-Shift-7': () => this.editor.commands.toggleOrderedList(),
    };
  },
});

export const createEditorExtensions = (options: {placeholder: string; disabled: boolean}) => [
  StarterKit.configure({
    heading: {levels: [1, 2, 3]},
    link: {
      openOnClick: options.disabled,
      HTMLAttributes: {
        class: styles.link,
        rel: 'noopener noreferrer',
      },
    },
  }),
  Placeholder.configure({
    placeholder: options.placeholder,
    emptyEditorClass: styles.placeholder,
  }),
  Markdown.configure({
    html: false,
    tightLists: true,
    tightListClass: 'tight',
    bulletListMarker: '-',
    linkify: true,
    breaks: true,
  }),
  ListShortcuts,
  TextColor,
  RichImage,
  RichVideo,
  BlankNode.configure({mode: options.disabled ? 'student' : 'teacher'}),
];

export const extensionNames = (
  extensions: ReturnType<typeof createEditorExtensions>,
): string[] => extensions.flatMap(extension => {
  const addExtensions = (extension as {
    config?: {addExtensions?: () => {name: string}[]};
  }).config?.addExtensions;
  const nested = addExtensions ? addExtensions.call(extension) : [];
  return [extension.name, ...nested.map(child => child.name)];
});
