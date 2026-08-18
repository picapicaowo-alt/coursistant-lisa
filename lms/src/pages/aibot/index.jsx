import {lazy, Suspense} from 'react';
import WorkflowPanel from './WorkflowPanel';
import styles from './index.module.scss';

const StudySupportChat = lazy(() => import('../../components/ChatContent'));

export default function AIBotPage() {
  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>AI WORKPLACE</p>
        <h1>Study Support &amp; Workflow</h1>
        <p>Use Study Support to learn and Workflow to complete supported LMS tasks.</p>
      </header>

      <div className={styles.workspaceGrid}>
        <section className={styles.toolCard} aria-labelledby="study-support-title">
          <div className={styles.toolHeader}>
            <div className={`${styles.toolIcon} ${styles.studyIcon}`} aria-hidden="true">S</div>
            <div>
              <h2 id="study-support-title">Study Support</h2>
              <span className={`${styles.badge} ${styles.studyBadge}`}>Questions · Explanations · Summaries</span>
            </div>
          </div>
          <p className={styles.toolDescription}>
            Ask questions grounded in your course materials, review concepts, and get help studying.
          </p>
          <div className={styles.divider}/>
          <div className={styles.studyChat}>
            <Suspense fallback={<div className={styles.loading}>Loading Study Support…</div>}>
              <StudySupportChat
                isIntroTop
                isSummary={false}
                isDashboard={false}
                isPopup={false}
                showHistory={false}
              />
            </Suspense>
          </div>
        </section>

        <WorkflowPanel/>
      </div>
    </main>
  );
}
