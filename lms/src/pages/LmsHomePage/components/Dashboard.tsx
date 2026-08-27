import {useState} from 'react';
import ChatComponent from './ChatComponent';
import CourseComponent from './CourseComponent';
import DashboardIntro from './DashboardIntro';
import DashboardSearch from './DashboardSearch';
import DueNextCard, {DashboardAssistantRequest} from './DueNextCard';
import AssignmentComponent from '@/sections/assignments/AssignmentComponent';
import PostComponent from '@/sections/posts/PostComponent';
import styles from './Dashboard.module.scss';

export const Dashboard = () => {
  const [assistantRequest, setAssistantRequest] = useState<DashboardAssistantRequest | null>(null);

  return (
    <section className={styles.dashboard} aria-label="Dashboard overview">
      <div className={styles.mainColumn}>
        <DashboardIntro/>
        <div className={styles.mobileSearch}><DashboardSearch/></div>
        <DueNextCard onAskAssistant={setAssistantRequest}/>

        <section className={styles.courses} aria-label="My courses">
          <CourseComponent/>
        </section>

        <div className={styles.workGrid}>
          <section className={styles.listSection} aria-label="More assignments">
            <AssignmentComponent title="More assignments" limit={3}/>
          </section>
          <section className={styles.listSection} aria-label="Announcements">
            <PostComponent limit={3}/>
          </section>
        </div>
      </div>

      <aside className={styles.assistantRail} aria-label="Coursistant AI chatbot">
        <ChatComponent dashboardRequest={assistantRequest}/>
      </aside>
    </section>
  );
};
