import MarkdownMessage from '@/components/MarkdownMessage';
import styles from './styles.module.scss';

export const renderMessageText = (text: string | null | undefined) => (
  text ? <MarkdownMessage content={text}/> : null
);

export const renderMessageTextFadeIn = (text: string | null | undefined) => (
  text ? <MarkdownMessage content={text} className={styles.fadeIn}/> : null
);
