import {Mark, mergeAttributes, Node} from '@tiptap/core';
import {normalizeSafeUrl, normalizeTextColor} from '../url';

export const TextColor = Mark.create({
  name: 'textColor',

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => normalizeTextColor((element as HTMLElement).style.color),
        renderHTML: attributes => {
          const color = normalizeTextColor(attributes.color);
          return color ? {style: `color: ${color}`} : {};
        },
      },
    };
  },

  parseHTML() {
    return [{tag: 'span[style]'}];
  },

  renderHTML({HTMLAttributes}) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

export const RichImage = Node.create({
  name: 'richImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => normalizeSafeUrl(element.getAttribute('src') ?? '', {mediaOnly: true}),
      },
      alt: {default: ''},
      title: {default: null},
    };
  },

  parseHTML() {
    return [{tag: 'img[src]'}];
  },

  renderHTML({HTMLAttributes}) {
    const src = normalizeSafeUrl(String(HTMLAttributes.src ?? ''), {mediaOnly: true});
    return ['img', mergeAttributes(HTMLAttributes, {
      src: src ?? '',
      loading: 'lazy',
      referrerpolicy: 'no-referrer',
    })];
  },
});

export const RichVideo = Node.create({
  name: 'richVideo',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => normalizeSafeUrl(element.getAttribute('src') ?? '', {mediaOnly: true}),
      },
      title: {default: null},
    };
  },

  parseHTML() {
    return [{tag: 'video[src]'}];
  },

  renderHTML({HTMLAttributes}) {
    const src = normalizeSafeUrl(String(HTMLAttributes.src ?? ''), {mediaOnly: true});
    return ['video', mergeAttributes(HTMLAttributes, {
      src: src ?? '',
      controls: 'controls',
      preload: 'metadata',
    })];
  },
});
