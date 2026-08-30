import React, {FormEvent, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {CourseMember, CourseSummary, unwrapData} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';
import {getApiErrorMessage} from '@/utils/apiError';
import {formatPersonName} from '@/utils/personName';
import styles from '../index.module.scss';

const COURSE_PAGE_SIZE = 100;
const MEMBER_PAGE_SIZE = 20;

type Feedback = {
  tone: 'success' | 'error';
  text: string;
};

type RoleChange = {
  member: CourseMember;
  targetRole: 'TA' | 'Student';
};

type EnrollmentRole = 'Student' | 'TA';

class PartialTaAssignmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PartialTaAssignmentError';
  }
}

const instructorLabel = (course: CourseSummary): string => {
  const instructor = course.primaryInstructor;
  if (!instructor) return 'No primary instructor';
  return formatPersonName({
    firstName: instructor.instructorFirstName,
    middleName: instructor.instructorMiddleName,
    lastName: instructor.instructorLastName,
  }) || instructor.email || `Instructor #${instructor.userId}`;
};

const memberRoleClass = (member: CourseMember): string => {
  if (member.courseRole === 'Instructor') return styles.roleInstructor;
  if (member.courseRole === 'TA') return styles.roleTa;
  return styles.roleStudent;
};

const CourseMemberRow = ({
  member,
  course,
  busy,
  pendingChange,
  onReviewChange,
  onConfirmChange,
  onCancelChange,
}: {
  member: CourseMember;
  course: CourseSummary;
  busy: boolean;
  pendingChange: RoleChange | null;
  onReviewChange: (change: RoleChange) => void;
  onConfirmChange: (change: RoleChange) => void;
  onCancelChange: () => void;
}) => {
  const isThisMemberPending = pendingChange?.member.userId === member.userId;
  const displayName = formatPersonName({
    firstName: member.userFirstName,
    middleName: member.userMiddleName,
    lastName: member.userLastName,
  }) || member.userEmail || `User #${member.userId}`;

  return (
    <article className={styles.courseMemberRow}>
      <div className={styles.memberIdentity}>
        <div className={styles.memberNameLine}>
          <strong>{displayName}</strong>
          <span className={`${styles.roleBadge} ${memberRoleClass(member)}`}>{member.courseRole}</span>
        </div>
        <span>{member.userEmail || 'Email not available'} · User #{member.userId}</span>
        {member.courseRole === 'TA' ? <small>TA access applies only to this course.</small> : null}
      </div>

      {isThisMemberPending && pendingChange ? (
        <div className={styles.roleChangeReview}>
          <p>
            {pendingChange.targetRole === 'TA'
              ? `Set ${displayName} as a TA for ${course.courseCode}? Existing student submissions in this course will be frozen.`
              : `Return ${displayName} to the Student role for ${course.courseCode}? Their TA permissions for this course will be removed.`}
          </p>
          <div className={styles.confirmRow}>
            <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => onConfirmChange(pendingChange)}>
              {busy ? 'Updating…' : pendingChange.targetRole === 'TA' ? 'Confirm TA assignment' : 'Confirm role change'}
            </button>
            <button type="button" className={styles.secondaryButton} disabled={busy} onClick={onCancelChange}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className={styles.memberActions}>
          {member.courseRole === 'Student' && member.active ? (
            <button type="button" disabled={busy} onClick={() => onReviewChange({member, targetRole: 'TA'})}>Set as TA</button>
          ) : null}
          {member.courseRole === 'TA' && member.active ? (
            <button type="button" disabled={busy} onClick={() => onReviewChange({member, targetRole: 'Student'})}>Return to student</button>
          ) : null}
        </div>
      )}
    </article>
  );
};

/**
 * Course-scoped membership controls for administrators. The selected course,
 * rather than an editable tenant value, owns the scope; the API remains the
 * authority for tenant boundaries and membership-role constraints.
 */
export const CourseMembershipPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [enrollmentRole, setEnrollmentRole] = useState<EnrollmentRole>('Student');
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<RoleChange | null>(null);

  const coursesQuery = useQuery({
    queryKey: ['admin', 'active-courses'],
    queryFn: async () => unwrapData(
      await courseApiService.browseCourses({state: 'Active', page: 0, size: COURSE_PAGE_SIZE}),
      'browseAdminCourses',
    ),
    retry: 1,
  });

  const courses = coursesQuery.data?.items ?? [];
  const effectiveCourseId = selectedCourseId ?? courses[0]?.id ?? null;
  const selectedCourse = courses.find(course => course.id === effectiveCourseId) ?? null;

  const membersQuery = useQuery({
    queryKey: ['admin', 'course-members', effectiveCourseId, memberPage, memberSearch],
    queryFn: async () => unwrapData(
      await courseApiService.listCourseMembers(effectiveCourseId!, {
        active: true,
        q: memberSearch || undefined,
        page: memberPage,
        size: MEMBER_PAGE_SIZE,
      }),
      'listAdminCourseMembers',
    ),
    enabled: effectiveCourseId !== null,
    retry: 1,
  });

  // The API applies role/name/userId ordering to the complete filtered result
  // before pagination. Keep the page in server order.
  const members = membersQuery.data?.items ?? [];

  const refreshMembers = async (courseId: number) => {
    await queryClient.invalidateQueries({queryKey: ['admin', 'course-members', courseId]});
  };

  const enrolStudent = useMutation({
    mutationFn: async ({courseId, value, targetRole}: {courseId: number; value: string; targetRole: EnrollmentRole}) => {
      const userId = /^[1-9]\d*$/.test(value) ? Number(value) : null;
      const result = unwrapData(
        await courseApiService.enrolStudents(courseId, userId ? {userIds: [userId]} : {emails: [value]}),
        'adminEnrolStudent',
      );

      const successfulItem = result.items.find(item => item.status === 'SUCCESS');
      const failure = result.items.find(item => item.status === 'ERROR');
      if (!successfulItem) {
        throw new Error(failure?.message || 'The user could not be enrolled. Confirm their tenant, account level, and current course membership.');
      }

      if (targetRole === 'TA') {
        const enrolledUserId = successfulItem.userId ?? successfulItem.member?.userId;
        if (!enrolledUserId) {
          throw new PartialTaAssignmentError('The user was enrolled, but TA access was not assigned because the enrollment response did not include a user ID.');
        }
        try {
          await courseApiService.promoteToTa(courseId, enrolledUserId);
        } catch (error) {
          throw new PartialTaAssignmentError(`The user was enrolled, but TA access was not assigned. ${getApiErrorMessage(error, 'Use “Set as TA” in the roster to try again.')}`);
        }
      }

      return {result, targetRole};
    },
    onSuccess: async ({targetRole}, variables) => {
      setIdentifier('');
      setFeedback({
        tone: 'success',
        text: targetRole === 'TA'
          ? 'User enrolled and assigned as a TA for the selected course.'
          : 'Student enrolled in the selected course.',
      });
      await refreshMembers(variables.courseId);
    },
    onError: async (error, variables) => {
      setFeedback({
        tone: 'error',
        text: getApiErrorMessage(error, 'The course access change failed. Confirm the user tenant, account level, and current course membership.'),
      });
      if (error instanceof PartialTaAssignmentError) {
        await refreshMembers(variables.courseId);
      }
    },
  });

  const changeCourseRole = useMutation({
    mutationFn: ({courseId, member, targetRole}: {courseId: number; member: CourseMember; targetRole: 'TA' | 'Student'}) => (
      targetRole === 'TA'
        ? courseApiService.promoteToTa(courseId, member.userId)
        : courseApiService.demoteTa(courseId, member.userId)
    ),
    onSuccess: async (_response, variables) => {
      setPendingRoleChange(null);
      setFeedback({
        tone: 'success',
        text: variables.targetRole === 'TA'
          ? 'TA assigned for the selected course.'
          : 'The course member is now a student.',
      });
      await refreshMembers(variables.courseId);
    },
    onError: (_error, variables) => setFeedback({
      tone: 'error',
      text: variables.targetRole === 'TA'
        ? 'TA status could not be assigned. Enroll the user as a student in this course first.'
        : 'TA status could not be removed.',
    }),
  });

  const submitEnrollment = (event: FormEvent) => {
    event.preventDefault();
    const value = identifier.trim();
    if (!effectiveCourseId || !value) return;
    setFeedback(null);
    enrolStudent.mutate({courseId: effectiveCourseId, value, targetRole: enrollmentRole});
  };

  const selectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setMemberPage(0);
    setMemberSearchInput('');
    setMemberSearch('');
    setIdentifier('');
    setEnrollmentRole('Student');
    setFeedback(null);
    setPendingRoleChange(null);
  };

  if (coursesQuery.isPending) {
    return <p className={styles.status}>Loading active courses…</p>;
  }

  if (coursesQuery.isError) {
    return (
      <div className={styles.status} role="alert">
        <p>Active courses could not be loaded.</p>
        <button type="button" className={styles.secondaryButton} onClick={() => void coursesQuery.refetch()}>Try again</button>
      </div>
    );
  }

  if (!selectedCourse) {
    return <p className={styles.status}>There are no active courses to manage.</p>;
  }

  const memberPageCount = Math.max(1, Math.ceil((membersQuery.data?.total ?? 0) / MEMBER_PAGE_SIZE));
  const roleChangeBusy = changeCourseRole.isPending;

  return (
    <div className={styles.contentGrid}>
      <section className={styles.card} aria-labelledby="course-access-title">
        <h2 id="course-access-title">Course access</h2>
        <p className={styles.hint}>Choose the teacher&apos;s course before adding a student or assigning a TA.</p>

        <div className={styles.form}>
          <label>
            <span>Teacher&apos;s course</span>
            <select value={effectiveCourseId} onChange={event => selectCourse(Number(event.target.value))}>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} — {course.title} · {instructorLabel(course)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.courseContext}>
          <span>{selectedCourse.courseCode}</span>
          <strong>{selectedCourse.title}</strong>
          <p>Teacher: {instructorLabel(selectedCourse)}</p>
          <small>Course #{selectedCourse.id} · Tenant #{selectedCourse.tenantId}</small>
        </div>

        <form className={styles.form} onSubmit={submitEnrollment}>
          <label>
            <span>User email or ID</span>
            <input value={identifier} onChange={event => setIdentifier(event.target.value)} placeholder="assistant@example.edu or 485"/>
          </label>
          <label>
            <span>Course role</span>
            <select value={enrollmentRole} onChange={event => setEnrollmentRole(event.target.value as EnrollmentRole)}>
              <option value="Student">Student</option>
              <option value="TA">Teaching assistant (TA)</option>
            </select>
          </label>
          <button className={styles.primaryButton} disabled={!identifier.trim() || enrolStudent.isPending}>
            {enrolStudent.isPending
              ? enrollmentRole === 'TA' ? 'Assigning TA…' : 'Enrolling…'
              : enrollmentRole === 'TA' ? 'Enroll and assign TA' : 'Enroll student'}
          </button>
        </form>
        <p className={styles.hint}>TA access applies only to the selected course; the user&apos;s platform level remains Student.</p>
        {feedback ? <p className={feedback.tone === 'error' ? styles.inlineError : styles.inlineSuccess} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.text}</p> : null}
      </section>

      <section className={`${styles.card} ${styles.listCard}`} aria-labelledby="course-roster-title">
        <div className={styles.cardHeader}>
          <div>
            <h2 id="course-roster-title">Course members</h2>
            <p>TA is a course role and does not change the user&apos;s account level.</p>
          </div>
          <span>{membersQuery.data?.total ?? 0}</span>
        </div>

        <form className={styles.memberSearch} onSubmit={event => {
          event.preventDefault();
          setMemberPage(0);
          setMemberSearch(memberSearchInput.trim());
        }}>
          <label className={styles.search}>
            <span>Search this course</span>
            <input value={memberSearchInput} onChange={event => setMemberSearchInput(event.target.value)} placeholder="Name, email, or user ID"/>
          </label>
          <button type="submit" className={styles.secondaryButton}>Search</button>
        </form>

        {membersQuery.isPending ? <p className={styles.status}>Loading course members…</p> : null}
        {membersQuery.isError ? (
          <div className={styles.status} role="alert">
            <p>Course members could not be loaded. Confirm that your admin role can manage this course.</p>
            <button type="button" className={styles.secondaryButton} onClick={() => void membersQuery.refetch()}>Try again</button>
          </div>
        ) : null}
        {!membersQuery.isPending && !membersQuery.isError && !members.length ? <p className={styles.status}>No active members match this search.</p> : null}

        {!membersQuery.isError && members.length ? (
          <div className={styles.courseMemberList}>
            {members.map(member => (
              <CourseMemberRow
                key={member.id}
                member={member}
                course={selectedCourse}
                busy={roleChangeBusy}
                pendingChange={pendingRoleChange}
                onReviewChange={setPendingRoleChange}
                onCancelChange={() => setPendingRoleChange(null)}
                onConfirmChange={change => changeCourseRole.mutate({courseId: selectedCourse.id, ...change})}
              />
            ))}
          </div>
        ) : null}

        {memberPageCount > 1 ? (
          <nav className={styles.pagination} aria-label="Course member pages">
            <button type="button" className={styles.secondaryButton} disabled={memberPage === 0} onClick={() => setMemberPage(page => page - 1)}>Previous</button>
            <span>{memberPage + 1} / {memberPageCount}</span>
            <button type="button" className={styles.secondaryButton} disabled={memberPage + 1 >= memberPageCount} onClick={() => setMemberPage(page => page + 1)}>Next</button>
          </nav>
        ) : null}
      </section>
    </div>
  );
};
