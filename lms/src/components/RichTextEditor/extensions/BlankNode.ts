// @ts-nocheck — legacy TipTap blank node; quarantined until editor migration (PROJECT_STANDARDS.md §13).
import {mergeAttributes, Node} from '@tiptap/core';
import {ReactNodeViewRenderer} from '@tiptap/react';
import {BlankComponent} from '../components/BlankComponent';

export interface BlankOptions {
  HTMLAttributes: Record<string, any>;
  mode: 'teacher' | 'student';
  onAnswerChange?: (id: string, answer: string) => void;
  minWidth?: string;
  maxWidth?: string;
  correctColor?: string;
  incorrectColor?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blank: {
      insertBlank: (attributes?: {
        id?: string;
        answer?: string;
        studentAnswer?: string;
        minWidth?: string;
        maxWidth?: string;
        placeholder?: string;
      }) => ReturnType;
      updateBlankAnswer: (id: string, answer: string) => ReturnType;
      updateBlankStudentAnswer: (id: string, studentAnswer: string) => ReturnType;
    };
  }
}

export const BlankNode = Node.create<BlankOptions>({
  name: 'blank',
  
  group: 'inline',
  inline: true,
  atom: true,
  
  addOptions() {
    return {
      HTMLAttributes: {},
      mode: 'student',
      minWidth: '80px',
      maxWidth: '300px',
      correctColor: '#10b981',
      incorrectColor: '#ef4444',
    };
  },
  
  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({
          'data-id': attributes.id,
        }),
      },
      answer: {
        default: '',
        parseHTML: element => element.getAttribute('data-answer'),
        renderHTML: attributes => ({
          'data-answer': attributes.answer,
        }),
      },
      studentAnswer: {
        default: '',
        parseHTML: element => element.getAttribute('data-student-answer'),
        renderHTML: attributes => ({
          'data-student-answer': attributes.studentAnswer,
        }),
      },
      minWidth: {
        default: this.options.minWidth,
        parseHTML: element => element.getAttribute('data-min-width') || this.options.minWidth,
        renderHTML: attributes => ({
          'data-min-width': attributes.minWidth,
        }),
      },
      maxWidth: {
        default: this.options.maxWidth,
        parseHTML: element => element.getAttribute('data-max-width') || this.options.maxWidth,
        renderHTML: attributes => ({
          'data-max-width': attributes.maxWidth,
        }),
      },
      placeholder: {
        default: 'Answer',
        parseHTML: element => element.getAttribute('data-placeholder'),
        renderHTML: attributes => ({
          'data-placeholder': attributes.placeholder,
        }),
      },

    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span[data-type="blank"]',
      },
    ];
  },
  
  renderHTML({HTMLAttributes}) {
    return ['span', mergeAttributes(
      {'data-type': 'blank'},
      HTMLAttributes
    )];
  },
  
  addCommands() {
    return {
      insertBlank: attributes => ({chain}) => {
        const id = attributes?.id || `blank-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        return chain()
          .insertContent({
            type: this.name,
            attrs: {
              id,
              answer: attributes?.answer || '',
              studentAnswer: attributes?.studentAnswer || '',
              minWidth: attributes?.minWidth || this.options.minWidth,
              maxWidth: attributes?.maxWidth || this.options.maxWidth,
              placeholder: attributes?.placeholder || 'Answer',
            },
          })
          .run();
      },
      
      updateBlankAnswer: (id, answer) => ({commands}) => {
        return commands.updateAttributes(this.name, {id, answer});
      },
      
      updateBlankStudentAnswer: (id, studentAnswer) => ({commands}) => {
        return commands.updateAttributes(this.name, {id, studentAnswer});
      },
    };
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(BlankComponent);
  },
});