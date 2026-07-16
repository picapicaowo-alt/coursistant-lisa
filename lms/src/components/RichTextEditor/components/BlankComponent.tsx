import React, {useEffect, useState, useRef} from 'react';
import {NodeViewWrapper} from '@tiptap/react';
import {Node} from '@tiptap/core';
import styles from './BlankComponent.module.scss';

interface BlankComponentProps {
  node: Node & {
    attrs: {
      id: string;
      answer: string;
      studentAnswer: string;
      minWidth: string;
      maxWidth: string;
      placeholder: string;
    };
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  editor: any;
}

export const BlankComponent: React.FC<BlankComponentProps> = ({
                                                                node,
                                                                updateAttributes,
                                                                editor
                                                              }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [localAnswer, setLocalAnswer] = useState(node.attrs.studentAnswer);
  const [isEditing, setIsEditing] = useState(false);
  const [inputWidth, setInputWidth] = useState(node.attrs.minWidth);
  
  const mode = editor.options.editorProps?.mode || 'student';
  const isTeacher = mode === 'teacher';
  
  const isCorrect = React.useMemo(() => {
    if (isTeacher || !node.attrs.answer) return null;
    return node.attrs.studentAnswer.toLowerCase().trim() === node.attrs.answer.toLowerCase().trim();
  }, [node.attrs.answer, node.attrs.studentAnswer, isTeacher]);
  
  const measureTextWidth = React.useCallback((text: string) => {
    if (!measureRef.current) return node.attrs.minWidth;
    
    measureRef.current.textContent = text || node.attrs.placeholder;
    const width = measureRef.current.offsetWidth + 24;
    
    const minWidth = parseInt(node.attrs.minWidth);
    const maxWidth = parseInt(node.attrs.maxWidth);
    const measuredWidth = Math.min(Math.max(width, minWidth), maxWidth);
    
    return `${measuredWidth}px`;
  }, [node.attrs.minWidth, node.attrs.maxWidth, node.attrs.placeholder]);
  
  useEffect(() => {
    const width = measureTextWidth(localAnswer || node.attrs.answer);
    setInputWidth(width);
  }, [localAnswer, node.attrs.answer, measureTextWidth]);
  
  useEffect(() => {
    setLocalAnswer(node.attrs.studentAnswer);
  }, [node.attrs.studentAnswer]);
  
  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    setLocalAnswer(newAnswer);
    
    const width = measureTextWidth(newAnswer);
    setInputWidth(width);
    
    if (isTeacher) {
      updateAttributes({answer: newAnswer});
    } else {
      updateAttributes({studentAnswer: newAnswer});
      
      if (editor.options.editorProps?.onAnswerChange) {
        editor.options.editorProps.onAnswerChange(node.attrs.id, newAnswer);
      }
    }
  };
  
  const handleFocus = () => {
    setIsEditing(true);
  };
  
  const handleBlur = () => {
    setIsEditing(false);
  };
  
  const measureElement = (
    <span
      ref={measureRef}
      className={styles.measureElement}
      style={{
        font: window.getComputedStyle(inputRef.current || document.body).font,
      }}
    />
  );
  
  const getInputClasses = () => {
    const classes = [styles.blankInput];
    
    if (isEditing) {
      classes.push(styles.isEditing);
    }
    
    if (localAnswer && isCorrect !== null) {
      classes.push(styles.hasAnswer);
      if (isCorrect) {
        classes.push(styles.correct);
      } else {
        classes.push(styles.incorrect);
      }
    }
    
    return classes.join(' ');
  };
  
  return (
    <NodeViewWrapper
      as="span"
      className={`${styles.blankNode} ${isTeacher ? styles.teacherMode : styles.studentMode}`}
    >
      {measureElement}
      <span className={styles.blankWrapper}>
        <input
          ref={inputRef}
          type="text"
          value={isTeacher ? (localAnswer || node.attrs.answer) : localAnswer}
          onChange={handleAnswerChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={node.attrs.placeholder}
          className={getInputClasses()}
          style={{
            width: inputWidth,
            minWidth: node.attrs.minWidth,
            maxWidth: node.attrs.maxWidth,
          }}
          disabled={!editor.isEditable || (!isTeacher && !editor.isEditable)}
        />
      </span>
    </NodeViewWrapper>
  );
};