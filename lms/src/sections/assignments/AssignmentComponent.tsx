import React, {useMemo, useState} from "react";
import {Link} from "react-router-dom";
import "./AssignmentComponent.scss";
import {AssignmentRow, useDashboardAssignments} from "@/pages/LmsHomePage/hooks/useDashboardAssignments";
import {formatDeadline, isPastDeadline} from "@/utils/datetime";
import {SubmissionStatus} from "@/apis";

/**
 * Dot color per submission state. Green means done, orange means it still
 * needs the student's attention, red means the window closed without a
 * submission — that last one is the only unrecoverable state, so it is the
 * only one that gets the alarming color.
 */
const STATUS_TONE: Record<SubmissionStatus, "green" | "orange" | "red"> = {
  Submitted: "green",
  SubmittedLate: "orange",
  NotSubmitted: "orange",
  NotSubmittedClosed: "red",
};

/** Wording follows the PRD submission states, not the Figma copy. */
const STATUS_LABEL: Record<SubmissionStatus, string> = {
  Submitted: "Submitted",
  SubmittedLate: "Submitted (late)",
  NotSubmitted: "Not submitted",
  NotSubmittedClosed: "Closed - not submitted",
};

/**
 * The per-course list widget.
 *
 * Students see their own upcoming work; teaching staff see how far each
 * published deadline has got. The Figma instructor variant lists individual
 * students with Graded / Notify buttons, but no endpoint returns per-student
 * submission rows for the dashboard and Notify is not a PRD action at all
 * (open-decisions.md S-4), so this shows the submitted/total figure the API
 * does provide rather than inventing the roster.
 */
const AssignmentComponent: React.FC = () => {
  const {rows, isInstructor, isLoading, isError, refetch} = useDashboardAssignments();
  const [pickedCourseId, setPickedCourseId] = useState<number | null>(null);

  // The dropdown is built from whatever came back, so it can never offer a
  // course the list has no rows for.
  const courses = useMemo(() => {
    const seen = new Map<number, string>();
    rows.forEach((row) => seen.set(row.courseId, row.courseCode));
    return [...seen].map(([id, code]) => ({id, code}));
  }, [rows]);

  // The design scopes this widget to one course at a time rather than
  // offering an "all courses" view, so fall back to the first one available.
  const activeCourseId = pickedCourseId ?? courses[0]?.id ?? null;
  const activeCourse = courses.find((course) => course.id === activeCourseId);

  const visibleRows = useMemo(
    () => rows.filter((row) => row.courseId === activeCourseId),
    [rows, activeCourseId]
  );

  return (
    <div className="assignment-container">
      <div className="assignment-header">
        {activeCourse ? (
          <select
            className="font-semibold text-[1.2rem] text-primary-color cursor-pointer bg-transparent"
            value={String(activeCourse.id)}
            onChange={(event) => setPickedCourseId(Number(event.target.value))}
            aria-label="Course"
          >
            {courses.map(({id, code}) => (
              <option key={id} value={String(id)}>{`[${code}]`}</option>
            ))}
          </select>
        ) : (
          <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">
            {isInstructor ? "Deadlines" : "Assignments"}
          </h1>
        )}

        <div className="spacer"/>

        {activeCourse && (
          <Link
            className="assignment-header-see-all"
            to={`/course/${activeCourse.id}`}
            aria-label={`See all work in ${activeCourse.code}`}
          >
            <p>See all</p>
            <img src="icons/assignments/arrow-right.png" alt=""/>
          </Link>
        )}
      </div>

      <div className="horizontal-line"/>

      <div className="assignment-body">
        <Body
          rows={visibleRows}
          isInstructor={isInstructor}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
        />
      </div>
    </div>
  );
};

interface BodyProps {
  rows: AssignmentRow[];
  isInstructor: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * A failed load must not look like an empty list — the dashboard contract says
 * so explicitly, and "nothing is due" would stop a student from checking.
 */
const Body: React.FC<BodyProps> = ({rows, isInstructor, isLoading, isError, refetch}) => {
  if (isLoading) {
    return <div className="assignment-body-item"><p>Loading…</p></div>;
  }

  if (isError) {
    return (
      <div className="assignment-body-item">
        <p>Couldn&apos;t load this list.</p>
        <button type="button" onClick={refetch} className="text-primary-color cursor-pointer underline">
          Retry
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="assignment-body-item">
        <p>{isInstructor ? "No upcoming deadlines." : "Nothing due in the next 14 days."}</p>
      </div>
    );
  }

  return <>{rows.map((row) => <Row key={row.key} row={row} isInstructor={isInstructor}/>)}</>;
};

/**
 * The action a student can take on a row.
 *
 * The design also shows Download on some unsubmitted rows and Regrade on a
 * graded one. Neither is produced here: nothing in the payload says whether an
 * assignment has a file to download, and Regrade is not a PRD action for
 * students at all (open-decisions.md Q-4). A closed assignment offers nothing.
 */
const studentAction = (status: SubmissionStatus): {label: string; primary: boolean} | null => {
  switch (status) {
    case "NotSubmitted":
      return {label: "Submit", primary: true};
    case "Submitted":
    case "SubmittedLate":
      return {label: "Resubmit", primary: false};
    case "NotSubmittedClosed":
      return null;
  }
};

const Row: React.FC<{row: AssignmentRow; isInstructor: boolean}> = ({row, isInstructor}) => {
  const overdue = isPastDeadline(row.atLocal, row.timezone);

  if (isInstructor) {
    return (
      <div className="xl-row">
        <div className="xl-row-main">
          <Link className="xl-row-title xl-row-title-link" to={row.destination}>{row.title}</Link>
        </div>
        <div className="xl-row-status">
          <span className={`xl-dot xl-dot--${overdue ? "red" : "green"}`}/>
          {formatDeadline(row.atLocal, row.timezone)}
        </div>
        {/* Figma lists individual students with Graded / Notify buttons here.
            No endpoint returns that roster, so this shows the submission
            progress the API does report. */}
        {row.progress && (
          <span className="xl-row-progress">
            {row.progress.submitted} / {row.progress.total} submitted
          </span>
        )}
      </div>
    );
  }

  const status = row.submissionStatus;
  const action = status ? studentAction(status) : null;

  return (
    <div className="xl-row">
      <div className="xl-row-main">
        {/* This endpoint only ever returns assignments, so the badge is not a
            guess — the type is implied by the source. */}
        <span className="xl-type-badge">Assignments</span>
        <Link className="xl-row-title xl-row-title-link" to={row.destination}>{row.title}</Link>
      </div>

      <div className="xl-row-status">
        <span className={`xl-dot xl-dot--${status ? STATUS_TONE[status] : "orange"}`}/>
        {status ? STATUS_LABEL[status] : formatDeadline(row.atLocal, row.timezone)}
      </div>

      {action && (
        <Link
          className={`xl-row-action${action.primary ? " xl-row-action--primary" : ""}`}
          to={row.destination}
          aria-label={`${action.label} ${row.title}`}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
};

export default AssignmentComponent;
