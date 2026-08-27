import ChatComponent from './ChatComponent';
import CourseComponent from './CourseComponent';
import DashboardIntro from './DashboardIntro';
import DashboardSearch from './DashboardSearch';
import AssignmentComponent from '@/sections/assignments/AssignmentComponent';
import PostComponent from '@/sections/posts/PostComponent';
import styles from './Dashboard.module.scss';

export const Dashboard = () => (
  <section className={styles.dashboard} aria-label="Dashboard overview">
    <div className={styles.mainColumn}>
      <DashboardIntro/>
      <div className={styles.mobileSearch}><DashboardSearch/></div>

      <section className={styles.courses} aria-label="My courses">
        <CourseComponent/>
      </section>

      <div className={styles.workGrid}>
        <section className={styles.listSection} aria-label="Assignments">
          <AssignmentComponent/>
        </section>
        <section className={styles.listSection} aria-label="Announcements">
          <PostComponent/>
        </section>
      </div>
    </div>

    <aside className={styles.assistantRail} aria-label="Coursistant AI chatbot">
      <ChatComponent/>
    </aside>
  </section>
);
