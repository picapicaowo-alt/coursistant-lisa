import React from 'react';
import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

import styles from './styles.module.scss';

export const renderMessageText = (text) => {
  if (!text) return null;
  return text.split(/(```[\s\S]*?```|`[^`]+`|\$\$.*?\$\$|\$.*?\$|\\\[(?:[\s\S]*?)\\\]|\\\((?:.*?)\\\)|\*\*.*?\*\*|###\s*.*|\n|\(https?:\/\/[^\s)]+\))/gm) // Matches all cases
      .filter((part) => part) // Remove empty matches
      .map((part, index) => {
        // Block Code (```)
        if (part.startsWith("```") && part.endsWith("```")) {
          return (
            <pre key={index} style={{ background: "#f5f5f5", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>
              <code>{part.slice(3, -3).trim()}</code>
            </pre>
          );
        }
  
        // Inline Code (`code`)
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index} style={{ background: "#eee", padding: "2px 4px", borderRadius: "3px" }}>{part.slice(1, -1)}</code>;
        }
  
        // Bold (**bold**)
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }

        // H1 (# Header)
        if (/^#\s/.test(part)) {
          return <h1 className={styles.h1} key={index}>{part.replace(/^#\s*/, "").trim()}</h1>;
        }

        // H2 (## Header)
        if (/^##\s/.test(part)) {
          return <h2 className={styles.h2} key={index}>{part.replace(/^##\s*/, "").trim()}</h2>;
        }

        // H3 (### Header)
        if (/^###\s/.test(part)) {
          return <h3 className={styles.h3} key={index}>{part.replace(/^###\s*/, "").trim()}</h3>;
        }

        // H4 (#### Header)
        if (/^####\s/.test(part)) {
          return <h4 className={styles.h4} key={index}>{part.replace(/^####\s*/, "").trim()}</h4>;
        }
  
        // Block Math ($$...$$)
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return (
            <BlockMath key={index} className={styles.mathContainer}>
              {part.slice(2, -2)}
            </BlockMath>
          );
        }
  
        // Inline Math ($...$)
        if (part.startsWith("$") && part.endsWith("$")) {
          return <InlineMath key={index}>{part.slice(1, -1)}</InlineMath>;
        }
  
        // Block Math (\[ ... \])
        if (part.startsWith("\\[")) {
          return (
            <BlockMath key={index} className="math-container">
              {part.slice(2, -2)}
            </BlockMath>
          );
        }
  
        // Inline Math (\( ... \))
        if (part.startsWith("\\(")) {
          return <InlineMath key={index}>{part.slice(2, -2)}</InlineMath>;
        }
        if (/^\(https?:\/\/[^\s)]+\)$/.test(part)) {
          const url = part.slice(1, -1); // Remove surrounding parentheses
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                alert(`Opening: ${url}`);
                window.open(url, "_blank");
              }}
              style={{ color: "blue", textDecoration: "underline" }}
            >
              {url}
            </a>
          );
        }
    
        return part;
  });
}

export const renderMessageTextFadeIn = (text) => {
  if (!text) return null;
  return text.split(/(```[\s\S]*?```|`[^`]+`|\$\$.*?\$\$|\$.*?\$|\\\[(?:[\s\S]*?)\\\]|\\\((?:.*?)\\\)|\*\*.*?\*\*|###\s*.*|\n|\(https?:\/\/[^\s)]+\))/gm) // Matches all cases
    .filter((part) => part) // Remove empty matches
    .map((part, index) => {
      // Block Code (```)
      if (part.startsWith("```") && part.endsWith("```")) {
        return (
          <pre key={index} style={{ background: "#f5f5f5", padding: "10px", borderRadius: "5px", overflowX: "auto" }}>
            <code className={styles.fadeIn}>{part.slice(3, -3).trim()}</code>
          </pre>
        );
      }

      // Inline Code (`code`)
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code className={styles.fadeIn} key={index} style={{ background: "#eee", padding: "2px 4px", borderRadius: "3px" }}>{part.slice(1, -1)}</code>;
      }

      // Bold (**bold**)
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong className={styles.fadeIn} key={index}>{part.slice(2, -2)}</strong>;
      }

      // H1 (# Header)
      if (/^#\s/.test(part)) {
        return <h1 className={`${styles.fadeIn} ${styles.h1}`} key={index}>{part.replace(/^#\s*/, "").trim()}</h1>;
      }

      // H2 (## Header)
      if (/^##\s/.test(part)) {
        return <h2 className={`${styles.fadeIn} ${styles.h2}`} key={index}>{part.replace(/^##\s*/, "").trim()}</h2>;
      }

      // H3 (### Header)
      if (/^###\s/.test(part)) {
        return <h3 className={`${styles.fadeIn} ${styles.h3}`} key={index}>{part.replace(/^###\s*/, "").trim()}</h3>;
      }

      // H4 (#### Header)
      if (/^####\s/.test(part)) {
        return <h4 className={`${styles.fadeIn} ${styles.h4}`} key={index}>{part.replace(/^####\s*/, "").trim()}</h4>;
      }

      // Block Math ($$...$$)
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return (
          <BlockMath key={index} className="math-container">
            {part.slice(2, -2)}
          </BlockMath>
        );
      }

      // Inline Math ($...$)
      if (part.startsWith("$") && part.endsWith("$")) {
        return <InlineMath className='fade-in' key={index}>{part.slice(1, -1)}</InlineMath>;
      }

      // Block Math (\[ ... \])
      if (part.startsWith("\\[")) {
        return (
          <BlockMath key={index} className="math-container">
            {part.slice(2, -2)}
          </BlockMath>
        );
      }
      if (/^\(https?:\/\/[^\s)]+\)$/.test(part)) {
        const url = part.slice(1, -1); // Remove surrounding parentheses
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              alert(`Opening: ${url}`);
              window.open(url, "_blank");
            }}
            style={{ color: "blue", textDecoration: "underline" }}
          >
            {url}
          </a>
        );
      }
      // Inline Math (\( ... \))
      if (part.startsWith("\\(")) {
        return <InlineMath className={styles.fadeIn} key={index}>{part.slice(2, -2)}</InlineMath>;
      }
      return part
      .split(/(\s+)/) // split by spaces, but keep the spaces too
      .map((word, i) => (
        <span key={`${index}-${i}`} className={styles.fadeIn}>
          {word}
        </span>
      ));
    });
}