import {FormEvent, useMemo, useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CheckCircle2, Download, MessageSquare, Search, Upload, X} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import type {GradingRosterItem, UpsertGradePayload} from '@/apis';
import {unwrapData} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import {saveBlob} from '@/utils/downloadBlob';
import styles from './index.module.scss';

type RosterFilter = 'All' | 'Ungraded' | 'Graded';

const parseId = (value?: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const getDisplayName = (row: GradingRosterItem) => row.groupName || row.studentName || 'Unknown learner';
const getDisplayEmail = (row: GradingRosterItem) => row.groupId
  ? `${row.memberCount ?? 0} group member(s)`
  : row.studentEmail || 'No email available';

const getInitials = (value: string) => value
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0]?.toUpperCase())
  .join('') || '?';

const formatSubmissionTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getSubmissionLabel = (value: string) => {
  const labels: Record<string, string> = {
    NotSubmitted: 'Not submitted',
    NotSubmittedClosed: 'Not submitted · closed',
    Submitted: 'Submitted',
    SubmittedLate: 'Submitted late',
  };
  return labels[value] ?? value.replace(/([a-z])([A-Z])/g, '$1 $2');
};

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

interface GradeDialogProps {
  row: GradingRosterItem;
  pointsPossible?: number;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: UpsertGradePayload, annotatedFile?: File) => void;
}

const GradeDialog = ({row, pointsPossible, isSaving, error, onClose, onSave}: GradeDialogProps) => {
  const [score, setScore] = useState(row.score === undefined ? '' : String(row.score));
  const [feedback, setFeedback] = useState('');
  const [annotatedFile, setAnnotatedFile] = useState<File | undefined>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedScore = Number(score);
    if (!Number.isFinite(parsedScore)) return;
    onSave({
      score: parsedScore,
      feedbackHtml: feedback.trim() ? `<p>${escapeHtml(feedback.trim())}</p>` : undefined,
      submissionVersionId: row.submissionVersionId,
      aiAssisted: false,
    }, annotatedFile);
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget && !isSaving) onClose();
    }}>
      <form className={styles.gradeDialog} role="dialog" aria-modal="true" aria-labelledby="grade-dialog-title" onSubmit={submit}>
        <header>
          <div>
            <p>Grade submission</p>
            <h2 id="grade-dialog-title">{getDisplayName(row)}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close grade editor">
            <X size={20}/>
          </button>
        </header>

        <label className={styles.scoreField}>
          <span>Score</span>
          <div>
            <input
              type="number"
              min="0"
              max={pointsPossible}
              step="0.01"
              value={score}
              onChange={event => setScore(event.target.value)}
              required
              autoFocus
            />
            <span>/ {pointsPossible ?? '—'}</span>
          </div>
        </label>

        <label className={styles.feedbackField}>
          <span>Feedback for the learner</span>
          <textarea
            rows={5}
            value={feedback}
            onChange={event => setFeedback(event.target.value)}
            placeholder="Add clear, actionable feedback…"
          />
        </label>

        <label className={styles.annotatedField}>
          <span><Upload size={16}/> Annotated feedback file</span>
          <input type="file" onChange={event => setAnnotatedFile(event.target.files?.[0])}/>
          <small>{annotatedFile ? annotatedFile.name : row.hasAnnotatedFile ? 'Uploading a new file replaces the current annotated file.' : 'Optional. Add a marked-up copy for the learner.'}</small>
        </label>

        <p className={styles.dialogNote}>
          Saving creates an Entered grade. The learner will not see it until grades are released.
        </p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <footer>
          <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="submit" className={styles.primaryButton} disabled={isSaving || score === ''}>
            {isSaving ? 'Saving…' : 'Save grade'}
          </button>
        </footer>
      </form>
    </div>
  );
};

const AssignmentGradingPage = () => {
  const {courseId: courseParam, assignmentId: assignmentParam} = useParams();
  const courseId = parseId(courseParam);
  const assignmentId = parseId(assignmentParam);
  const access = useCourseAccess(courseId);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RosterFilter>('All');
  const [selectedRow, setSelectedRow] = useState<GradingRosterItem | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [isReleasing, setReleasing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const rosterQuery = useQuery({
    queryKey: ['assignment-grading-roster', courseId, assignmentId],
    enabled: courseId !== null && assignmentId !== null && access.isResolved && access.canGrade,
    queryFn: async () => unwrapData(
      await assignmentApiService.getGradingRoster(courseId!, assignmentId!),
      'getGradingRoster'
    ),
  });

  const rows = useMemo(() => {
    const roster = rosterQuery.data?.items ?? [];
    const needle = search.trim().toLowerCase();

    return roster.filter(row => {
      const graded = row.gradeStatus !== 'Ungraded';
      const matchesFilter = filter === 'All' || (filter === 'Graded' ? graded : !graded);
      const matchesSearch = !needle || [row.studentName, row.studentEmail, row.groupName]
        .some(value => value?.toLowerCase().includes(needle));
      return matchesFilter && matchesSearch;
    });
  }, [filter, rosterQuery.data?.items, search]);

  const saveGrade = async (payload: UpsertGradePayload, annotatedFile?: File) => {
    if (!selectedRow || courseId === null || assignmentId === null) return;
    setSaving(true);
    setActionError(null);

    try {
      if (selectedRow.groupId !== undefined) {
        await assignmentApiService.upsertGroupGrade(courseId, assignmentId, selectedRow.groupId, payload);
        if (annotatedFile) await assignmentApiService.uploadGroupAnnotatedFile(courseId, assignmentId, selectedRow.groupId, annotatedFile);
      } else if (selectedRow.studentUserId !== undefined) {
        await assignmentApiService.upsertStudentGrade(courseId, assignmentId, selectedRow.studentUserId, payload);
        if (annotatedFile) await assignmentApiService.uploadStudentAnnotatedFile(courseId, assignmentId, selectedRow.studentUserId, annotatedFile);
      } else {
        throw new Error('Roster row has no grading target.');
      }

      await queryClient.invalidateQueries({queryKey: ['assignment-grading-roster', courseId, assignmentId]});
      setSelectedRow(null);
    } catch {
      setActionError('The grade could not be saved. Your score and feedback are still here.');
    } finally {
      setSaving(false);
    }
  };

  const downloadAnnotated = async (row: GradingRosterItem) => {
    if (courseId === null || assignmentId === null) return;
    setActionError(null);
    try {
      const blob = row.groupId !== undefined
        ? await assignmentApiService.downloadGroupAnnotatedFile(courseId, assignmentId, row.groupId)
        : await assignmentApiService.downloadStudentAnnotatedFile(courseId, assignmentId, row.studentUserId!);
      saveBlob(blob, `${getDisplayName(row).replace(/[^a-z0-9_-]+/gi, '-')}-annotated-feedback`);
    } catch {
      setActionError('The annotated feedback file could not be downloaded.');
    }
  };

  const releaseAll = async () => {
    if (courseId === null || assignmentId === null) return;
    if (!window.confirm('Release every entered grade to learners now?')) return;

    setReleasing(true);
    setActionError(null);
    try {
      await assignmentApiService.releaseAllGrades(courseId, assignmentId);
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['assignment-grading-roster', courseId, assignmentId]}),
        queryClient.invalidateQueries({queryKey: ['assignment', courseId, assignmentId]}),
      ]);
    } catch {
      setActionError('Grades could not be released. No local status was changed.');
    } finally {
      setReleasing(false);
    }
  };

  if (courseId === null || assignmentId === null) {
    return <div className={styles.status} role="alert">This grading link is invalid.</div>;
  }

  if (access.isLoading) {
    return <div className={styles.status}>Checking course permissions…</div>;
  }

  if (access.isError) {
    return (
      <div className={styles.status} role="alert">
        <p>Course permissions couldn&apos;t be loaded.</p>
        <button type="button" className={styles.primaryButton} onClick={access.refetch}>Try again</button>
      </div>
    );
  }

  if (!access.canGrade) {
    return <div className={styles.status} role="alert">You don&apos;t have grading permission for this course.</div>;
  }

  if (rosterQuery.isLoading || rosterQuery.isPending) {
    return <div className={styles.status}>Loading grading roster…</div>;
  }

  if (rosterQuery.isError || !rosterQuery.data) {
    return (
      <div className={styles.status} role="alert">
        <p>This grading roster couldn&apos;t be loaded.</p>
        <button type="button" className={styles.primaryButton} onClick={() => void rosterQuery.refetch()}>Try again</button>
      </div>
    );
  }

  const roster = rosterQuery.data;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headingGroup}>
          <Link to={`/course/${courseId}/assignments/${assignmentId}`} className={styles.backButton} aria-label="Back to assignment">
            <ArrowLeft size={20}/>
          </Link>
          <div>
            <p className={styles.eyebrow}>Grading</p>
            <h1>{roster.assignmentTitle}</h1>
          </div>
        </div>
        {access.canReleaseGrades ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void releaseAll()}
            disabled={isReleasing || roster.enteredCount === 0 || !roster.gradingWritable}
          >
            <CheckCircle2 size={18}/>
            {isReleasing ? 'Releasing…' : `Release entered grades (${roster.enteredCount})`}
          </button>
        ) : (
          <p className={styles.taNotice}>TA access: grades can be entered, but only the Instructor can release them.</p>
        )}
      </header>

      <section className={styles.metrics} aria-label="Grading summary">
        <div><span>Submitted</span><strong>{roster.submittedCount}/{roster.totalStudents}</strong></div>
        <div><span>Late</span><strong>{roster.lateCount}</strong></div>
        <div><span>Ungraded</span><strong>{roster.ungradedCount}</strong></div>
        <div><span>Released</span><strong>{roster.releasedCount}</strong></div>
      </section>

      <section className={styles.rosterCard}>
        <div className={styles.toolbar}>
          <label className={styles.searchField}>
            <Search size={18}/>
            <span className={styles.srOnly}>Search learners</span>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search learners"/>
          </label>
          <div className={styles.filters} aria-label="Grade status filter">
            {(['All', 'Ungraded', 'Graded'] as const).map(value => (
              <button
                key={value}
                type="button"
                className={filter === value ? styles.activeFilter : undefined}
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {actionError && !selectedRow ? <p className={styles.error} role="alert">{actionError}</p> : null}

        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Learner</th>
                <th>Submission</th>
                <th>Submitted at</th>
                <th>Score</th>
                <th>Grade status</th>
                <th><span className={styles.srOnly}>Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const name = getDisplayName(row);
                const key = row.groupId !== undefined ? `group-${row.groupId}` : `student-${row.studentUserId}`;
                return (
                  <tr key={key}>
                    <td>
                      <div className={styles.learner}>
                        <span className={styles.avatar}>{getInitials(name)}</span>
                        <span><strong>{name}</strong><small>{getDisplayEmail(row)}</small></span>
                      </div>
                    </td>
                    <td><span className={styles.submissionBadge} data-status={row.submissionStatus}>{getSubmissionLabel(row.submissionStatus)}</span></td>
                    <td>{formatSubmissionTime(row.submittedAt)}</td>
                    <td className={styles.score}>{row.score ?? '—'} / {roster.pointsPossible ?? '—'}</td>
                    <td><span className={styles.gradeBadge} data-status={row.gradeStatus}>{row.gradeStatus}</span></td>
                    <td>
                      <div className={styles.rowButtons}>{row.hasAnnotatedFile ? <button type="button" className={styles.gradeButton} onClick={() => void downloadAnnotated(row)} aria-label={`Download annotated feedback for ${name}`}><Download size={17}/><span>File</span></button> : null}<button
                        type="button"
                        className={styles.gradeButton}
                        onClick={() => {
                          setActionError(null);
                          setSelectedRow(row);
                        }}
                        disabled={!roster.gradingWritable}
                        aria-label={`Grade ${name}`}
                      >
                        <MessageSquare size={18}/>
                        <span>{row.gradeStatus === 'Ungraded' ? 'Grade' : 'Edit'}</span>
                      </button></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 ? <p className={styles.empty}>No roster rows match this view.</p> : null}
        </div>
      </section>

      {!roster.gradingWritable ? (
        <p className={styles.readOnlyNotice} role="status">This course is outside its grading window. The roster is read-only.</p>
      ) : null}

      {selectedRow ? (
        <GradeDialog
          row={selectedRow}
          pointsPossible={roster.pointsPossible}
          isSaving={isSaving}
          error={actionError}
          onClose={() => {
            if (!isSaving) setSelectedRow(null);
          }}
          onSave={(payload, annotatedFile) => void saveGrade(payload, annotatedFile)}
        />
      ) : null}
    </div>
  );
};

export default AssignmentGradingPage;
