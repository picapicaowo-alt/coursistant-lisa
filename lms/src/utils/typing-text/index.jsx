import React, { useState, useEffect } from 'react';
import { renderMessageTextFadeIn } from '../render-message-text';

const TypingText = ({ text, speed = 20, onDone }) => {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }

    if (onDone) onDone();
  }, [index, text, speed, onDone]);

  return (
    <div className="whitespace-pre-line text-base text-gray-900">
      {renderMessageTextFadeIn(displayed)}
    </div>
  );
};

export default TypingText;