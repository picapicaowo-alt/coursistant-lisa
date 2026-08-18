import {CalendarDays} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {CourseEvent} from '@/apis';
import styles from './index.module.scss';

interface Props { courseId: number; events: CourseEvent[]; failed: boolean; canManage: boolean; }

export const EventsCard = ({courseId, events, failed, canManage}: Props) => {
  const ordered = [...events].sort((a, b) => `${a.date}${a.startTime ?? ''}`.localeCompare(`${b.date}${b.startTime ?? ''}`));
  return <section className={styles.card}>
    <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Course events</h2><Link to={`/course/${courseId}/events`} className={styles.addButton}>{canManage ? 'Manage events' : 'View all'}</Link></div>
    {failed ? <p className={styles.cardEmpty} role="alert">Couldn&apos;t load course events.</p> : ordered.length === 0 ? <p className={styles.cardEmpty}>No course events scheduled.</p> : <ul className={styles.rowList}>{ordered.slice(0, 4).map(event => <li className={styles.row} key={event.id}><Link className={styles.rowLink} to={`/course/${courseId}/events/${event.id}`}><span className={styles.eventBadge}><CalendarDays size={16}/></span><span className={styles.rowTitle}>{event.name}</span><span className={styles.rowMeta}>{event.date}{event.startTime ? ` · ${event.startTime.slice(0, 5)}` : ''}</span></Link></li>)}</ul>}
  </section>;
};
