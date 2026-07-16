import React from 'react';
import {Editor} from '@tiptap/react';
import {Level} from '@tiptap/extension-heading';
import styles from './index.module.scss';

interface ToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  toolbarVisible?: boolean;
  toggleToolbar?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({editor, disabled, toolbarVisible = true, toggleToolbar}) => {
  if (!editor || disabled) {
    return null;
  }
  
  const headings = [
    {level: 0, label: 'Normal Text', title: 'Normal Paragraph'},
    {level: 1, label: 'Heading 1', title: 'Large Heading'},
    {level: 2, label: 'Heading 2', title: 'Medium Heading'},
    {level: 3, label: 'Heading 3', title: 'Small Heading'},
  ];
  
  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Input Link URL', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
  };
  
  return (
    <div className={styles.toolbarContainer}>
      {toolbarVisible ? (
        <>
          <div className={styles.toolbarGroup}>
            <select
              value={editor.isActive('heading') ? editor.getAttributes('heading').level : 0}
              onChange={(e) => {
                const level = parseInt(e.target.value);
                if (level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({level: level as Level}).run();
                }
              }}
              className={styles.toolbarSelect}
            >
              {headings.map((heading) => (
                <option key={heading.level} value={heading.level}>
                  {heading.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.active : ''}`}
              type="button"
              title="Bold (Ctrl+B)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.active : ''}`}
              type="button"
              title="Italic (Ctrl+I)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 4h-9M14 20H5M15 4L9 20"></path>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`${styles.toolbarButton} ${editor.isActive('underline') ? styles.active : ''}`}
              type="button"
              title="Underline (Ctrl+U)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`${styles.toolbarButton} ${editor.isActive('strike') ? styles.active : ''}`}
              type="button"
              title="Strikethrough"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6"></path>
                <line x1="4" y1="12" x2="20" y2="12"></line>
              </svg>
            </button>
          </div>
          
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.active : ''}`}
              type="button"
              title="Bullet List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <circle cx="3" cy="6" r="1"></circle>
                <circle cx="3" cy="12" r="1"></circle>
                <circle cx="3" cy="18" r="1"></circle>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.active : ''}`}
              type="button"
              title="Numbered List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="21" y2="6"></line>
                <line x1="10" y1="12" x2="21" y2="12"></line>
                <line x1="10" y1="18" x2="21" y2="18"></line>
                <path d="M4 6h1v4"></path>
                <path d="M4 10h2"></path>
                <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
              </svg>
            </button>
          </div>
          
          <div className={styles.toolbarGroup}>
            <button
              onClick={toggleLink}
              className={`${styles.toolbarButton} ${editor.isActive('link') ? styles.active : ''}`}
              type="button"
              title="Insert Link (Ctrl+K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`${styles.toolbarButton} ${editor.isActive('blockquote') ? styles.active : ''}`}
              type="button"
              title="Blockquote"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 11H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.8-2.2 5-5 5"></path>
                <path d="M20 11h-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v6c0 2.8-2.2 5-5 5"></path>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`${styles.toolbarButton} ${editor.isActive('code') ? styles.active : ''}`}
              type="button"
              title="Inline Code"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </button>
            
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className={styles.toolbarButton}
              type="button"
              title="Horizontal Rule"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="13" y1="5" x2="11" y2="19"></line>
              </svg>
            </button>
          </div>
          
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.commands.insertBlank()}
              className={styles.toolbarButton}
              type="button"
              title="Insert Question (Blank)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="16"></line>
              </svg>
            </button>
          </div>
        </>
      ) : null}
      
      <div className={styles.toolbarGroup}>
        <button
          onClick={toggleToolbar}
          className={styles.toolbarButton}
          type="button"
          title={toolbarVisible ? "Collapse Toolbar" : "Expand Toolbar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {toolbarVisible ? (
              <path d="M5 12h14M5 12l4-4m-4 4l4 4"></path>
            ) : (
              <path d="M19 12H5m14 0l-4 4m4-4l-4-4"></path>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;