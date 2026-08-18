import React from 'react';
import {Editor} from '@tiptap/react';
import {Level} from '@tiptap/extension-heading';
import {
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
import {normalizeSafeUrl} from './url';

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  toolbarVisible?: boolean;
  toggleToolbar?: () => void;
}

const TEXT_COLORS = [
  {name: 'Default', value: ''},
  {name: 'Slate', value: '#2D3748'},
  {name: 'Blue', value: '#435BD4'},
  {name: 'Teal', value: '#0F766E'},
  {name: 'Orange', value: '#B45309'},
  {name: 'Red', value: '#BE123C'},
  {name: 'Purple', value: '#7C3AED'},
];

const Toolbar: React.FC<ToolbarProps> = ({editor, disabled, toolbarVisible = true, toggleToolbar}) => {
  if (!editor || disabled) return null;

  const headings = [
    {level: 0, label: 'Normal text'},
    {level: 1, label: 'Heading 1'},
    {level: 2, label: 'Heading 2'},
    {level: 3, label: 'Heading 3'},
  ];

  const requestUrl = (message: string, mediaOnly = false) => {
    const value = window.prompt(message);
    if (value === null) return null;
    const url = normalizeSafeUrl(value, {mediaOnly, allowRelative: !mediaOnly});
    if (!url) window.alert(mediaOnly ? 'Enter a valid HTTP or HTTPS URL.' : 'Enter a valid HTTP, HTTPS, email, or relative link.');
    return url;
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

  const insertImage = () => {
    const src = requestUrl('Image URL', true);
    if (!src) return;
    const alt = window.prompt('Image description (for accessibility)', '') ?? '';
    editor.chain().focus().insertContent([
      {type: 'richImage', attrs: {src, alt}},
      {type: 'paragraph'},
    ]).run();
  };

  const insertVideo = () => {
    const src = requestUrl('Direct video file URL (HTTP or HTTPS)', true);
    if (!src) return;
    editor.chain().focus().insertContent([
      {type: 'richVideo', attrs: {src}},
      {type: 'paragraph'},
    ]).run();
  };

  const insertFile = () => {
    const href = requestUrl('File URL');
    if (!href) return;
    const label = window.prompt('File name', 'Download file')?.trim() || 'Download file';
    editor.chain().focus().insertContent({
      type: 'text',
      text: label,
      marks: [{type: 'link', attrs: {href, target: '_blank', rel: 'noopener noreferrer'}}],
    }).run();
  };

  return (
    <div className={styles.toolbarContainer} aria-label="Text formatting toolbar">
      {toolbarVisible ? (
        <>
          <div className={styles.toolbarGroup}>
            <select
              aria-label="Text style"
              value={editor.isActive('heading') ? editor.getAttributes('heading').level : 0}
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
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.active : ''}`} type="button" aria-label="Bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.active : ''}`} type="button" aria-label="Italic" title="Italic (Ctrl+I)"><em>I</em></button>
            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${styles.toolbarButton} ${editor.isActive('underline') ? styles.active : ''}`} type="button" aria-label="Underline" title="Underline (Ctrl+U)"><u>U</u></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`${styles.toolbarButton} ${editor.isActive('strike') ? styles.active : ''}`} type="button" aria-label="Strikethrough" title="Strikethrough"><s>S</s></button>
          </div>

          <div className={styles.toolbarGroup}>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.active : ''}`} type="button" aria-label="Bulleted list" title="Bulleted list"><List size={17}/></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.active : ''}`} type="button" aria-label="Numbered list" title="Numbered list"><ListOrdered size={17}/></button>
          </div>

          <div className={styles.toolbarGroup}>
            <details className={styles.toolbarMenu}>
              <summary className={styles.toolbarButton} aria-label="Text color" title="Text color"><Palette size={16}/><ChevronDown size={13}/></summary>
              <div className={styles.colorMenu}>
                {TEXT_COLORS.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    className={styles.colorOption}
                    onClick={() => color.value
                      ? editor.chain().focus().setMark('textColor', {color: color.value}).run()
                      : editor.chain().focus().unsetMark('textColor').run()}
                  >
                    <span style={{backgroundColor: color.value || '#FFFFFF'}} aria-hidden="true"/>{color.name}
                  </button>
                ))}
              </div>
            </details>
            <button onClick={toggleLink} className={`${styles.toolbarButton} ${editor.isActive('link') ? styles.active : ''}`} type="button" aria-label="Insert link" title="Insert link (Ctrl+K)"><Link2 size={16}/></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${styles.toolbarButton} ${editor.isActive('blockquote') ? styles.active : ''}`} type="button" aria-label="Blockquote" title="Blockquote"><Quote size={16}/></button>
            <button onClick={() => editor.chain().focus().toggleCode().run()} className={`${styles.toolbarButton} ${editor.isActive('code') ? styles.active : ''}`} type="button" aria-label="Inline code" title="Inline code"><CodeXml size={17}/></button>
          </div>

          <div className={styles.toolbarGroup}>
            <details className={styles.toolbarMenu}>
              <summary className={styles.insertButton}>Insert <ChevronDown size={14}/></summary>
              <div className={styles.insertMenu}>
                <button type="button" onClick={insertImage}><ImagePlus size={16}/>Image</button>
                <button type="button" onClick={insertVideo}><Video size={16}/>Video</button>
                <button type="button" onClick={insertFile}><FilePlus2 size={16}/>File</button>
                <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16}/>Divider</button>
              </div>
            </details>
          </div>
        </>
      ) : null}

      <div className={styles.toolbarGroup}>
        <button onClick={toggleToolbar} className={styles.toolbarButton} type="button" aria-label={toolbarVisible ? 'Collapse toolbar' : 'Expand toolbar'} title={toolbarVisible ? 'Collapse toolbar' : 'Expand toolbar'}>
          {toolbarVisible ? <PanelTopClose size={17}/> : <PanelTopOpen size={17}/>}<span className={styles.visuallyHidden}>{toolbarVisible ? 'Hide' : 'Format'}</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
