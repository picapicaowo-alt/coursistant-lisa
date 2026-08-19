import React, {useEffect, useState} from 'react';
import {useEditor, EditorContent} from '@tiptap/react';
import Toolbar from './Toolbar';
import styles from './index.module.scss';
import {createEditorExtensions} from './extensions';
import {normalizeSafeUrl} from './url';

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
  displayOnly?: boolean;
  ariaLabel?: string;
}

export const RichTextEditor: React.FC<TextBlockProps> = (props) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShouldRender(true);
    const frame = requestAnimationFrame(() => setIsInitialized(true));
    return () => cancelAnimationFrame(frame);
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
                                                          displayOnly = false,
                                                          ariaLabel = 'Rich text editor',
                                                        }) => {
  
  const [toolbarVisible, setToolbarVisible] = React.useState(defaultToolbarVisible);
  
  const editor = useEditor({
    extensions: createEditorExtensions({placeholder, disabled}),
    content,
    editable: !disabled,
    onUpdate: ({editor}) => {
      onChange?.(editor.getHTML());
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
        'aria-label': ariaLabel,
      },
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
  
  const editorHtml = editor?.getHTML();
  useEffect(() => {
    if (editor && adjustHeight) {
      requestAnimationFrame(() => {
        adjustHeight(index);
      });
    }
  }, [editor, editorHtml, adjustHeight, index]);
  
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
    
    // Bold/italic/underline/strike already have Mod-* bindings in StarterKit's keymap, which
    // runs on this same element before this listener. Re-handling them here would toggle each
    // mark twice per keypress and cancel it out, so only unbound shortcuts belong below.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (event.key.toLowerCase() !== 'k') return;
      
      event.preventDefault();
      const previousUrl = editor.getAttributes('link').href as string | undefined;
      const url = window.prompt('Link URL', previousUrl ?? '');
      
      if (url === null) return;
      if (url.trim() === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      const safeUrl = normalizeSafeUrl(url, {allowRelative: true});
      if (!safeUrl) {
        window.alert('Enter a valid HTTP, HTTPS, email, or relative link.');
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({href: safeUrl}).run();
    };
    
    editor.view.dom.addEventListener('keydown', handleKeyDown);
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);
  
  return (
    <div className={`${styles.container} ${disabled && !displayOnly ? styles.disabled : ''} ${displayOnly ? styles.displayOnly : ''}`}>
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
