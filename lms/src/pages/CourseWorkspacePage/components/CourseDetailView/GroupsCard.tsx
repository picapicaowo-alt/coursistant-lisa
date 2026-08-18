import {Lock, Users} from 'lucide-react';
import {Link} from 'react-router-dom';
import type {CourseGroupSet} from '@/apis';
import styles from './index.module.scss';

interface Props { courseId: number; groupSets: CourseGroupSet[]; failed: boolean; canManage: boolean; }

export const GroupsCard = ({courseId, groupSets, failed, canManage}: Props) => <section className={styles.card}>
  <div className={styles.cardHeader}><h2 className={styles.cardTitle}>Groups</h2><Link to={`/course/${courseId}/groups`} className={styles.addButton}>{canManage ? 'Manage groups' : 'View all'}</Link></div>
  {failed ? <p className={styles.cardEmpty} role="alert">Couldn&apos;t load course groups.</p> : groupSets.length === 0 ? <p className={styles.cardEmpty}>No group sets in this course.</p> : <ul className={styles.rowList}>{groupSets.slice(0, 4).map(item => {
    const myGroup = item.myGroup ? item.groups.find(group => group.id === item.myGroup?.groupId) : null;
    return <li className={styles.row} key={item.id}><Link className={styles.rowLink} to={`/course/${courseId}/group-sets/${item.id}`}><span className={styles.eventBadge}>{item.locked ? <Lock size={16}/> : <Users size={16}/>}</span><span className={styles.rowTitle}>{item.name}</span><span className={styles.rowMeta}>{myGroup?.name || `${item.groups.length} groups`}</span></Link></li>;
  })}</ul>}
</section>;
