import React from 'react';
import {Link} from 'react-router-dom';
import {UsersRound} from 'lucide-react';
import styles from './index.module.scss';

export const RosterCard: React.FC<{courseId: number}> = ({courseId}) => (
  <section className={styles.card}>
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>Roster</h2>
      <Link className={styles.addButton} to={`/roster/${courseId}`}>Manage roster</Link>
    </div>
    <div className={styles.rosterSummary}>
      <UsersRound size={22} aria-hidden="true"/>
      <p>Enroll students, review course roles, and manage teaching assistants.</p>
    </div>
  </section>
);
