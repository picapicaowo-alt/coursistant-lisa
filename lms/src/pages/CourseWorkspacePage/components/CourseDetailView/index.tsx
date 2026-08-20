import React, {useEffect, useState} from "react";
import styles from "./index.module.scss";
import {useCourseWorkspaceData} from "../../hooks/useCourseWorkspaceData";
import {formatCourseName} from "@/utils/course";
import {WeekOutline} from "./WeekOutline";
import {ContentCard} from "./ContentCard";
import {AssignmentsCard} from "./AssignmentsCard";
import {ScheduleCard} from "./ScheduleCard";
import {QuizzesCard} from './QuizzesCard';
import {EventsCard} from './EventsCard';
import {GroupsCard} from './GroupsCard';
import {SyllabusCard} from '../SyllabusCard';
import {RosterCard} from './RosterCard';
import {AnnouncementsCard} from './AnnouncementsCard';

interface CourseDetailViewProps {
  canCreateAssignments?: boolean;
  canManageEvents?: boolean;
  canManageGroups?: boolean;
  canPostAnnouncements?: boolean;
}

/**
 * Course detail, view mode — see docs/design/13-course-detail-view.png.
 *
 * Two columns: the week outline on the left, a stack of content cards on the
 * right. The design's third card, "Assignments are weighted by group", is not
 * built. Weighted grade groups do not exist in the PRD — a student sees
 * per-item scores and no course total — and no endpoint stores a weight, so
 * the card would be decoration over nothing (open-decisions.md B-3).
 */
export const CourseDetailView: React.FC<CourseDetailViewProps> = ({canCreateAssignments = false, canManageEvents = false, canManageGroups = false, canPostAnnouncements = false}) => {
  const {
    course, weeks, sessions, assignments, quizzes, events, groupSets, announcements,
    isLoading, isError, sessionsFailed, assignmentsFailed, quizzesFailed, eventsFailed, groupSetsFailed, announcementsFailed, refetch,
  } = useCourseWorkspaceData();

  const [activeWeekId, setActiveWeekId] = useState<number | null>(null);

  // Follow the design and open on the first week, but only once the weeks are
  // actually here — and never override a week the user has chosen.
  useEffect(() => {
    if (activeWeekId === null && weeks.length > 0) {
      setActiveWeekId(weeks[0].id);
    }
  }, [weeks, activeWeekId]);

  if (isLoading) {
    return <div className={styles.status}>Loading course…</div>;
  }

  if (isError || !course) {
    return (
      <div className={styles.status} role="alert">
        <p>This course couldn&apos;t be loaded.</p>
        <button type="button" className={styles.retry} onClick={refetch}>Try again</button>
      </div>
    );
  }

  const activeWeek = weeks.find((week) => week.id === activeWeekId) ?? null;

  return (
    <div className={styles.layout}>
      <aside className={styles.outline}>
        <h1 className={styles.courseTitle}>
          {formatCourseName(course.courseCode, course.title ?? course.name)}
        </h1>
        <div className={styles.divider}/>
        <WeekOutline
          weeks={weeks}
          activeWeekId={activeWeekId}
          onSelect={setActiveWeekId}
        />
      </aside>

      <div className={styles.cards}>
        <ContentCard week={activeWeek}/>
        <SyllabusCard courseId={course.id} canManage={canCreateAssignments}/>
        <AnnouncementsCard
          courseId={course.id}
          announcements={announcements}
          failed={announcementsFailed}
          canManage={canPostAnnouncements}
        />
        <AssignmentsCard
          courseId={course.id}
          assignments={assignments}
          failed={assignmentsFailed}
          canCreate={canCreateAssignments}
        />
        <QuizzesCard
          courseId={course.id}
          quizzes={quizzes}
          failed={quizzesFailed}
          canCreate={canCreateAssignments}
        />
        <EventsCard courseId={course.id} events={events} failed={eventsFailed} canManage={canManageEvents}/>
        <GroupsCard courseId={course.id} groupSets={groupSets} failed={groupSetsFailed} canManage={canManageGroups}/>
        {canCreateAssignments ? <RosterCard courseId={course.id}/> : null}
        <ScheduleCard sessions={sessions} failed={sessionsFailed} courseId={course.id} canManage={canManageEvents}/>
      </div>
    </div>
  );
};
