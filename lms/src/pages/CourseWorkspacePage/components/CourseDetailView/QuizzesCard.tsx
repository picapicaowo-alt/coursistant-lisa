import type {QuizResponse} from '@/apis';
import {Link} from 'react-router-dom';
import styles from './index.module.scss';

interface Props {
  courseId: number;
  quizzes: QuizResponse[];
  failed: boolean;
  canCreate?: boolean;
}

const formatWindow = (quiz: QuizResponse) => {
  const close = new Date(quiz.closesAtUtc);
  return Number.isNaN(close.getTime())
    ? quiz.closesAtLocal
    : new Intl.DateTimeFormat('en-US', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'}).format(close);
};

export const QuizzesCard = ({courseId, quizzes, failed, canCreate = false}: Props) => (
  <section className={styles.card}>
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>Quizzes</h2>
      {canCreate ? <Link to={`/course/${courseId}/quizzes/new`} className={styles.addButton}>Add quiz</Link> : null}
    </div>

    {failed ? (
      <p className={styles.cardEmpty} role="alert">Couldn&apos;t load quizzes.</p>
    ) : quizzes.length === 0 ? (
      <p className={styles.cardEmpty}>No quizzes in this course yet.</p>
    ) : (
      <ul className={styles.rowList}>
        {quizzes.map(quiz => (
          <li key={quiz.id} className={styles.row}>
            <Link to={`/course/${courseId}/quizzes/${quiz.id}`} className={styles.rowLink}>
              <span className={styles.stateTag}>{quiz.state}</span>
              <span className={styles.rowTitle}>{quiz.title}</span>
              <span className={styles.rowMeta}>Closes {formatWindow(quiz)}</span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
);
