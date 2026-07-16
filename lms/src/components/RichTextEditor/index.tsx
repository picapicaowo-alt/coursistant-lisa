import React, {useEffect, useState} from 'react';
import {useEditor, EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';
import Blockquote from '@tiptap/extension-blockquote';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Toolbar from './Toolbar';
import styles from './index.module.scss';
import {Markdown} from "tiptap-markdown";
import {BlankNode} from './extensions/BlankNode';

interface TextBlockProps {
  content?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange?: (content: string) => void;
  onMouseUp?: () => void;
  registerRef?: (index: number, ref: HTMLElement | null) => void;
  index?: number;
  adjustHeight?: (index: number) => void;
  showToolbar?: boolean;
  defaultToolbarVisible?: boolean;
}

export const RichTextEditor: React.FC<TextBlockProps> = (props) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShouldRender(true);
      
      requestAnimationFrame(() => {
        setIsInitialized(true);
      });
    }
  }, []);
  
  if (!shouldRender) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingPlaceholder}>
          Loading editor...
        </div>
      </div>
    );
  }
  
  if (!isInitialized) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingPlaceholder}>
          Loading editor...
        </div>
      </div>
    );
  }
  
  return <RichTextEditorClient {...props} />;
};

const RichTextEditorClient: React.FC<TextBlockProps> = ({
                                                          content = '',
                                                          disabled = false,
                                                          placeholder = 'Start writing your content here...',
                                                          onChange,
                                                          onMouseUp,
                                                          registerRef,
                                                          index = 0,
                                                          adjustHeight,
                                                          showToolbar = true,
                                                          defaultToolbarVisible = true,
                                                        }) => {
  
  const [toolbarVisible, setToolbarVisible] = React.useState(defaultToolbarVisible);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Bold,
      Italic,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.link,
        },
      }),
      Blockquote,
      Code,
      CodeBlock,
      HorizontalRule,
      Placeholder.configure({
        placeholder,
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
      BlankNode.configure({
        mode: disabled ? 'student' : 'teacher',
      })
    ],
    content,
    editable: !disabled,
    onUpdate: ({editor}) => {
      const md = editor.getText();
      onChange?.(md);
    },
    onSelectionUpdate: ({editor}) => {
      if (onMouseUp && editor.state.selection.empty === false) {
        onMouseUp();
      }
    },
    editorProps: {
      attributes: {
        class: styles.editor,
        'data-testid': 'text-block-editor',
        spellcheck: 'true',
      },
      mode: disabled ? 'student' : 'teacher',
    },
  });
  
  useEffect(() => {
    if (editor && registerRef) {
      const element = editor.view.dom;
      registerRef(index, element);
      return () => {
        registerRef(index, null);
      };
    }
  }, [editor, registerRef, index]);
  
  useEffect(() => {
    if (editor && adjustHeight) {
      requestAnimationFrame(() => {
        adjustHeight(index);
      });
    }
  }, [editor?.getHTML(), adjustHeight, index]);
  
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);
  
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);
  
  useEffect(() => {
    if (!editor) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        editor.chain().focus().toggleBold().run();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'i') {
        event.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'u') {
        event.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Input Link', previousUrl);
        
        if (url === null) return;
        if (url === '') {
          editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({href: url}).run();
      }
    };
    
    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);
  
  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      {showToolbar && editor && (
        <Toolbar 
          editor={editor} 
          disabled={disabled} 
          toolbarVisible={toolbarVisible}
          toggleToolbar={() => setToolbarVisible(!toolbarVisible)}
        />
      )}
      <EditorContent editor={editor}/>
    </div>
  );
};