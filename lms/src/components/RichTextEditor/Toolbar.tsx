import React from 'react';
import {useEditorState} from '@tiptap/react';
import type {Editor} from '@tiptap/react';
import {Level} from '@tiptap/extension-heading';
import {
  Check,
  ChevronDown,
  CodeXml,
  FilePlus2,
  ImagePlus,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  PanelTopClose,
  PanelTopOpen,
  Quote,
  Video,
} from 'lucide-react';
import styles from './index.module.scss';
import MediaInsertDialog from './MediaInsertDialog';
import type {MediaInsertPayload} from './MediaInsertDialog';
import {normalizeSafeUrl} from './url';

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  toolbarVisible?: boolean;
  toggleToolbar?: () => void;
}

const isApplePlatform = () => {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPad|iPhone|iPod/i.test(navigator.platform || navigator.userAgent);
};

const shortcut = (key: string, {shift = false, alt = false} = {}) => {
  if (isApplePlatform()) return `${alt ? '⌥' : ''}${shift ? '⇧' : ''}⌘${key}`;
  return `Ctrl+${alt ? 'Alt+' : ''}${shift ? 'Shift+' : ''}${key}`;
};

const TEXT_COLORS = [
  {name: 'Default', value: ''},
  {name: 'Black', value: '#000000'},
  {name: 'Gray', value: '#64748B'},
  {name: 'Red', value: '#DC2626'},
  {name: 'Orange', value: '#EA580C'},
  {name: 'Yellow', value: '#EAB308'},
  {name: 'Green', value: '#16A34A'},
  {name: 'Teal', value: '#0D9488'},
  {name: 'Blue', value: '#2563EB'},
  {name: 'Purple', value: '#9333EA'},
  {name: 'Pink', value: '#DB2777'},
];

interface ToolbarButtonProps {
  label: string;
  hint?: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({label, hint, active, onClick, children}) => (
  <button
    type="button"
    onMouseDown={event => event.preventDefault()}
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    data-tooltip={hint ? `${label} · ${hint}` : label}
    className={`${styles.toolbarButton} ${styles.tooltipHost} ${active ? styles.active : ''}`}
  >
    {children}
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({editor, disabled, toolbarVisible = true, toggleToolbar}) => {
  const colorMenuRef = React.useRef<HTMLDetailsElement>(null);
  const insertMenuRef = React.useRef<HTMLDetailsElement>(null);
  const [insertOpen, setInsertOpen] = React.useState(false);
  const formattingState = useEditorState({
    editor,
    selector: ({editor: currentEditor}) => ({
      headingLevel: Number(currentEditor?.getAttributes('heading').level ?? 0),
      bold: currentEditor?.isActive('bold') ?? false,
      italic: currentEditor?.isActive('italic') ?? false,
      underline: currentEditor?.isActive('underline') ?? false,
      strike: currentEditor?.isActive('strike') ?? false,
      bulletList: currentEditor?.isActive('bulletList') ?? false,
      orderedList: currentEditor?.isActive('orderedList') ?? false,
      link: currentEditor?.isActive('link') ?? false,
      blockquote: currentEditor?.isActive('blockquote') ?? false,
      code: currentEditor?.isActive('code') ?? false,
      textColor: String(currentEditor?.getAttributes('textColor').color ?? '').toLowerCase(),
    }),
  });

  if (!editor || disabled) return null;

  const headings = [
    {level: 0, label: 'Normal text'},
    {level: 1, label: 'Heading 1'},
    {level: 2, label: 'Heading 2'},
    {level: 3, label: 'Heading 3'},
  ];

  const closeMenu = (ref: React.RefObject<HTMLDetailsElement | null>) => {
    if (ref.current) ref.current.open = false;
  };

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const value = window.prompt('Link URL', previousUrl ?? '');
    if (value === null) return;
    if (value.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = normalizeSafeUrl(value, {allowRelative: true});
    if (!url) {
      window.alert('Enter a valid HTTP, HTTPS, email, or relative link.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
  };

  const activeColor = formattingState?.textColor ?? '';

  const toggleInlineMark = (mark: 'bold' | 'italic' | 'underline' | 'strike' | 'code') => {
    editor.chain().focus().toggleMark(mark, {}, {extendEmptyMarkRange: true}).run();
  };

  const applyColor = (value: string) => {
    if (value) editor.chain().focus().setMark('textColor', {color: value}).run();
    else editor.chain().focus().unsetMark('textColor').run();
    closeMenu(colorMenuRef);
  };

  const openInsertDialog = () => {
    closeMenu(insertMenuRef);
    setInsertOpen(true);
  };

  const insertUploadedMedia = (payload: MediaInsertPayload) => {
    if (payload.kind === 'image') {
      editor.chain().focus().insertContent([
        {type: 'richImage', attrs: {src: payload.url, alt: payload.name}},
        {type: 'paragraph'},
      ]).run();
    } else if (payload.kind === 'video') {
      editor.chain().focus().insertContent([
        {type: 'richVideo', attrs: {src: payload.url}},
        {type: 'paragraph'},
      ]).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'text',
        text: payload.name,
        marks: [{type: 'link', attrs: {href: payload.url, target: '_blank', rel: 'noopener noreferrer'}}],
      }).run();
    }
    setInsertOpen(false);
  };

  const insertDivider = () => {
    closeMenu(insertMenuRef);
    editor.chain().focus().setHorizontalRule().run();
  };

  return (
    <div className={styles.toolbarContainer} aria-label="Text formatting toolbar">
      {insertOpen ? (
        <MediaInsertDialog
          onClose={() => setInsertOpen(false)}
          onInsert={insertUploadedMedia}
        />
      ) : null}
      {toolbarVisible ? (
        <>
          <div className={styles.toolbarGroup}>
            <select
              aria-label="Text style"
              title="Text style"
              value={formattingState?.headingLevel ?? 0}
              onChange={event => {
                const level = Number(event.target.value);
                if (level === 0) editor.chain().focus().setParagraph().run();
                else editor.chain().focus().toggleHeading({level: level as Level}).run();
              }}
              className={styles.toolbarSelect}
            >
              {headings.map(heading => <option key={heading.level} value={heading.level}>{heading.label}</option>)}
            </select>
          </div>

          <div className={styles.toolbarGroup}>
            <ToolbarButton label="Bold" hint={shortcut('B')} active={formattingState?.bold} onClick={() => toggleInlineMark('bold')}>
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton label="Italic" hint={shortcut('I')} active={formattingState?.italic} onClick={() => toggleInlineMark('italic')}>
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton label="Underline" hint={shortcut('U')} active={formattingState?.underline} onClick={() => toggleInlineMark('underline')}>
              <u>U</u>
            </ToolbarButton>
            <ToolbarButton label="Strikethrough" hint={shortcut('S', {shift: true})} active={formattingState?.strike} onClick={() => toggleInlineMark('strike')}>
              <s>S</s>
            </ToolbarButton>
          </div>

          <div className={styles.toolbarGroup}>
            <ToolbarButton label="Bullet list" hint={shortcut('8', {shift: true})} active={formattingState?.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <List size={17}/>
            </ToolbarButton>
            <ToolbarButton label="Numbered list" hint={shortcut('7', {shift: true})} active={formattingState?.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={17}/>
            </ToolbarButton>
          </div>

          <div className={styles.toolbarGroup}>
            <details className={styles.toolbarMenu} ref={colorMenuRef}>
              <summary className={`${styles.toolbarButton} ${styles.tooltipHost}`} aria-label="Text color" data-tooltip="Text color">
                <Palette size={16} color={activeColor || undefined}/><ChevronDown size={13}/>
              </summary>
              <div className={styles.colorMenu}>
                <p className={styles.menuLabel}>Text color</p>
                <div className={styles.colorGrid}>
                  {TEXT_COLORS.map(color => {
                    const selected = activeColor === color.value.toLowerCase();
                    return (
                      <button
                        key={color.name}
                        type="button"
                        aria-label={color.name}
                        aria-pressed={selected}
                        data-tooltip={color.name}
                        className={`${styles.colorSwatch} ${styles.tooltipHost} ${selected ? styles.colorSwatchSelected : ''}`}
                        onClick={() => applyColor(color.value)}
                      >
                        <span
                          className={color.value ? styles.swatchDot : `${styles.swatchDot} ${styles.swatchDotDefault}`}
                          style={color.value ? {backgroundColor: color.value} : undefined}
                          aria-hidden="true"
                        >
                          {selected ? <Check size={12} strokeWidth={3}/> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </details>
            <ToolbarButton label="Insert link" hint={shortcut('K')} active={formattingState?.link} onClick={toggleLink}>
              <Link2 size={16}/>
            </ToolbarButton>
            <ToolbarButton label="Blockquote" hint={shortcut('B', {shift: true})} active={formattingState?.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote size={16}/>
            </ToolbarButton>
            <ToolbarButton label="Inline code" hint={shortcut('E')} active={formattingState?.code} onClick={() => toggleInlineMark('code')}>
              <CodeXml size={17}/>
            </ToolbarButton>
          </div>

          <div className={styles.toolbarGroup}>
            <details className={styles.toolbarMenu} ref={insertMenuRef}>
              <summary className={styles.insertButton}>Insert <ChevronDown size={14}/></summary>
              <div className={styles.insertMenu}>
                <button type="button" onClick={openInsertDialog}><ImagePlus size={16}/>Image</button>
                <button type="button" onClick={openInsertDialog}><Video size={16}/>Video</button>
                <button type="button" onClick={openInsertDialog}><FilePlus2 size={16}/>File</button>
                <button type="button" onClick={insertDivider}><Minus size={16}/>Divider</button>
              </div>
            </details>
          </div>
        </>
      ) : null}

      <div className={styles.toolbarGroup}>
        <ToolbarButton
          label={toolbarVisible ? 'Collapse toolbar' : 'Expand toolbar'}
          onClick={() => toggleToolbar?.()}
        >
          {toolbarVisible ? <PanelTopClose size={17}/> : <PanelTopOpen size={17}/>}
          <span className={styles.visuallyHidden}>{toolbarVisible ? 'Hide' : 'Format'}</span>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default Toolbar;
