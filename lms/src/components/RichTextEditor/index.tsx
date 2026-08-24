import React, {useEffect, useRef} from 'react';
import type {Editor} from '@tiptap/core';
import {useEditor, EditorContent} from '@tiptap/react';
import MarkdownMessage from '../MarkdownMessage';
import Toolbar from './Toolbar';
import styles from './index.module.scss';
import {createEditorExtensions} from './extensions';
import {normalizeSafeUrl} from './url';
import 'katex/dist/katex.min.css';

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
  variant?: 'default' | 'composer' | 'inline';
  className?: string;
  onSubmit?: () => void;
  outputFormat?: 'markdown' | 'html';
}

const MARKDOWN_SOURCE_PATTERN = /(^|\n)\s{0,3}(?:#{1,6}\s|>\s|```|~~~|[-+*]\s|\d+\.\s)|(?:\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|`[^`\n]+`|\[[^\]\n]+\]\([^\n)]+\)|\$[^$\n]+\$|\$\$[\s\S]+?\$\$)/m;

const LEGACY_HTML_PATTERN = /<(?:p|div|h[1-6]|ul|ol|li|blockquote|pre|code|strong|em|u|s|a|img|video|span|br|hr)\b/i;

const editorMarkdown = (editor: Editor): string => {
  return typeof editor.getMarkdown === 'function'
    ? editor.getMarkdown()
    : editor.getText({blockSeparator: '\n\n'});
};

const editorRequiresHtml = (editor: Editor): boolean => {
  let required = false;
  editor.state.doc.descendants(node => {
    required = ['richImage', 'richVideo', 'blank'].includes(node.type.name)
      || node.marks.some(mark => ['underline', 'textColor'].includes(mark.type.name));
    return !required;
  });
  return required;
};

export const RichTextEditor: React.FC<TextBlockProps> = (props) => {
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
                                                          variant = 'default',
                                                          className,
                                                          onSubmit,
                                                          outputFormat = 'markdown',
                                                        }) => {
  
  const [toolbarVisible, setToolbarVisible] = React.useState(defaultToolbarVisible);
  const [markdownContent, setMarkdownContent] = React.useState('');
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  const liveEditorRef = useRef<Editor | null>(null);
  const lastEmittedContentRef = useRef<string | null>(null);
  const recentEmittedContentRef = useRef<string[]>([]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);
  
  const editor = useEditor({
    extensions: createEditorExtensions({placeholder, disabled}),
    content,
    contentType: LEGACY_HTML_PATTERN.test(content) ? 'html' : 'markdown',
    editable: !disabled,
    onCreate: ({editor}) => {
      liveEditorRef.current = editor;
      setMarkdownContent(editorMarkdown(editor));
    },
    onDestroy: () => {
      liveEditorRef.current = null;
    },
    onUpdate: ({editor}) => {
      const markdown = editorMarkdown(editor);
      const nextContent = outputFormat === 'html' || editorRequiresHtml(editor)
        ? editor.getHTML()
        : markdown;
      lastEmittedContentRef.current = nextContent;
      const recent = recentEmittedContentRef.current;
      if (recent[recent.length - 1] !== nextContent) {
        recent.push(nextContent);
        if (recent.length > 100) recent.shift();
      }
      onChangeRef.current?.(nextContent);
      setMarkdownContent(markdown);
    },
    onSelectionUpdate: ({editor}) => {
      if (onMouseUp && editor.state.selection.empty === false) {
        onMouseUp();
      }
    },
    editorProps: {
      attributes: {
        class: [
          styles.editor,
          variant === 'composer' ? styles.composerEditor : '',
          variant === 'inline' ? styles.inlineEditor : '',
        ].filter(Boolean).join(' '),
        'data-testid': 'text-block-editor',
        spellcheck: 'true',
        role: 'textbox',
        'aria-label': ariaLabel,
        'aria-multiline': 'true',
        'data-placeholder': placeholder,
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && onSubmitRef.current) {
          const currentEditor = liveEditorRef.current;
          if (!currentEditor) return false;

          // A fenced-code opener should become a real code block before the
          // composer's Enter-to-submit behavior runs. Once inside code or display
          // math, Enter belongs to the document rather than the send action.
          const {$from} = currentEditor.state.selection;
          const textBeforeCursor = $from.parent.isTextblock
            ? $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
            : '';
          const codeFence = /^```([\w+-]*)$/.exec(textBeforeCursor);
          if (codeFence) {
            event.preventDefault();
            const codeBlockType = currentEditor.state.schema.nodes.codeBlock;
            if (!codeBlockType) return true;
            const transaction = currentEditor.state.tr
              .setBlockType(
                $from.before(),
                $from.after(),
                codeBlockType,
                {language: codeFence[1] || null},
              )
              .delete($from.start(), $from.pos);
            currentEditor.view.dispatch(transaction);
            currentEditor.view.focus();
            return true;
          }
          if (currentEditor.isActive('codeBlock') || currentEditor.isActive('blockMath')) {
            return false;
          }

          event.preventDefault();
          onSubmitRef.current();
          return true;
        }

        if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== 'k') {
          return false;
        }

        const currentEditor = liveEditorRef.current;
        if (!currentEditor) return false;
        event.preventDefault();
        const previousUrl = currentEditor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Link URL', previousUrl ?? '');

        if (url === null) return true;
        if (url.trim() === '') {
          currentEditor.chain().focus().extendMarkRange('link').unsetLink().run();
          return true;
        }
        const safeUrl = normalizeSafeUrl(url, {allowRelative: true});
        if (!safeUrl) {
          window.alert('Enter a valid HTTP, HTTPS, email, or relative link.');
          return true;
        }
        currentEditor.chain().focus().extendMarkRange('link').setLink({href: safeUrl}).run();
        return true;
      },
      handlePaste: (_view, event) => {
        if (event.clipboardData?.files.length) return false;
        const text = event.clipboardData?.getData('text/plain') ?? '';
        const shouldNormalizeComposerPaste = variant === 'composer' && Boolean(text);
        if (!shouldNormalizeComposerPaste && (!text || !MARKDOWN_SOURCE_PATTERN.test(text))) return false;

        const currentEditor = liveEditorRef.current;
        if (!currentEditor) return false;
        // Chat bubbles can place a white inline color in text/html. Composer
        // pastes intentionally consume text/plain so copied user messages stay
        // readable on the white input surface and are inserted exactly once.
        event.preventDefault();
        currentEditor.chain().focus().insertContent(text, {contentType: 'markdown'}).run();
        return true;
      },
      handleDoubleClickOn: (view, pos, node) => {
        if (disabled || !['inlineMath', 'blockMath'].includes(node.type.name)) return false;

        const latex = window.prompt('Edit LaTeX', node.attrs.latex as string);
        if (latex === null || latex.trim() === '') return true;
        view.dispatch(view.state.tr.setNodeMarkup(pos, node.type, {
          ...node.attrs,
          latex: latex.trim(),
        }));
        return true;
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
    if (editor) {
      // React may deliver controlled-value echoes a character or two behind a fast
      // ProseMirror transaction stream. Ignore values emitted by this editor, but
      // still accept genuinely external updates (for example feedback loaded after
      // the editor mounts), even if another field has already moved focus.
      if (content === lastEmittedContentRef.current) return;
      if (content !== '' && recentEmittedContentRef.current.includes(content)) return;
      const currentContent = outputFormat === 'html' || editorRequiresHtml(editor)
        ? editor.getHTML()
        : editorMarkdown(editor);
      if (content === currentContent) return;
      editor.commands.setContent(content, {
        emitUpdate: false,
        contentType: LEGACY_HTML_PATTERN.test(content) ? 'html' : 'markdown',
      });
      lastEmittedContentRef.current = content;
      setMarkdownContent(editorMarkdown(editor));
    }
  }, [content, editor, outputFormat]);
  
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);
  
  const renderDisplayAsMarkdown = displayOnly
    && Boolean(markdownContent)
    && Boolean(editor)
    && !editorRequiresHtml(editor);

  const rootClassName = [
    styles.container,
    disabled && !displayOnly ? styles.disabled : '',
    displayOnly ? styles.displayOnly : '',
    variant === 'composer' ? styles.composer : '',
    variant === 'inline' ? styles.inline : '',
    className ?? '',
  ].filter(Boolean).join(' ');
  
  return (
    <div className={rootClassName}>
      {showToolbar && editor && (
        <Toolbar 
          editor={editor} 
          disabled={disabled} 
          toolbarVisible={toolbarVisible}
          toggleToolbar={() => setToolbarVisible(!toolbarVisible)}
        />
      )}
      {renderDisplayAsMarkdown
        ? <MarkdownMessage content={markdownContent}/>
        : <EditorContent editor={editor}/>}
    </div>
  );
};
