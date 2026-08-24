import ReactMarkdown, {type Components} from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import styles from './MarkdownMessage.module.scss';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

const MARKDOWN_COMPONENTS: Components = {
  a: ({href, children}) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  table: ({children}) => (
    <div className={styles.tableScroll}>
      <table>{children}</table>
    </div>
  ),
};

/**
 * Shared chat renderer: CommonMark through react-markdown, GitHub Flavored
 * Markdown extensions, and TeX math rendered safely with KaTeX.
 */
const MarkdownMessage = ({content, className}: MarkdownMessageProps) => {
  const rootClassName = className
    ? `${styles.markdown} ${className}`
    : styles.markdown;

  return (
    <div className={rootClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={MARKDOWN_COMPONENTS}
        skipHtml
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
