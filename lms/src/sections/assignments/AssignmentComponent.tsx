import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import "./AssignmentComponent.scss";
import {AssignmentRow, useDashboardAssignments} from "@/pages/LmsHomePage/hooks/useDashboardAssignments";
import {formatDeadline, isPastDeadline} from "@/utils/datetime";
import {SubmissionStatus} from "@/apis";

const ALL_COURSES = "__all__";

/** Maps a submission state to the dot color the row already styles for. */
const STATUS_TONE: Record<SubmissionStatus, "green" | "gray" | "red"> = {
  Submitted: "green",
  SubmittedLate: "gray",
  NotSubmitted: "red",
  NotSubmittedClosed: "red",
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  Submitted: "Submitted",
  SubmittedLate: "Submitted late",
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
  const navigate = useNavigate();
  const {rows, isInstructor, isLoading, isError, refetch} = useDashboardAssignments();
  const [courseFilter, setCourseFilter] = useState<string>(ALL_COURSES);

  // The header dropdown is built from whatever came back, so it can never
  // offer a course the list has no rows for.
  const courses = useMemo(() => {
    const seen = new Map<number, string>();
    rows.forEach((row) => seen.set(row.courseId, row.courseCode));
    return [...seen].map(([id, code]) => ({id, code}));
  }, [rows]);

  const visibleRows = useMemo(
    () => courseFilter === ALL_COURSES
      ? rows
      : rows.filter((row) => String(row.courseId) === courseFilter),
    [rows, courseFilter]
  );

  return (
    <div className="assignment-container">
      <div className="assignment-header">
        <select
          className="font-semibold text-[1.2rem] text-primary-color cursor-pointer bg-transparent"
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          aria-label="Filter by course"
        >
          <option value={ALL_COURSES}>{isInstructor ? "Deadlines" : "Assignments"}</option>
          {courses.map(({id, code}) => (
            <option key={id} value={String(id)}>{code}</option>
          ))}
        </select>

        <div className="spacer"/>

        {courseFilter !== ALL_COURSES && (
          <div
            className="assignment-header-see-all"
            onClick={() => navigate(`/course/${courseFilter}`)}
          >
            <p>See all</p>
            <img src="icons/assignments/arrow-right.png" alt=""/>
          </div>
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

const Row: React.FC<{row: AssignmentRow; isInstructor: boolean}> = ({row, isInstructor}) => {
  const overdue = isPastDeadline(row.atLocal, row.timezone);
  const tone = row.submissionStatus
    ? STATUS_TONE[row.submissionStatus]
    : overdue ? "red" : "green";

  return (
    <div className="assignment-body-item">
      <div className="assignment-body-item-course">
        <div className="assignment-body-item-course-header">
          <img src="icons/assignments/ellipse_blue.png" alt=""/>
          <p>{row.courseCode}</p>
        </div>
        <p>{row.title}</p>
      </div>

      <div className="assignment-body-item-due-date">
        <div className="assignment-body-item-due-date-header">
          <p>Due Date</p>
        </div>
        <div className={`assignment-body-item-due-date-date due-${tone}`}>
          {formatDeadline(row.atLocal, row.timezone)}
        </div>
      </div>

      <div className="assignment-body-item-progress">
        <div className="assignment-body-item-progress-header">
          {/* Students get their own state; staff get submission counts. No
              score is shown to either: grades are not part of this payload,
              and a student must not see one before it is released. */}
          <p>
            {isInstructor && row.progress
              ? `${row.progress.submitted} / ${row.progress.total}`
              : row.submissionStatus
                ? STATUS_LABEL[row.submissionStatus]
                : ""}
          </p>
        </div>
        {isInstructor && row.progress && row.progress.total > 0 && (
          <div className="assignment-body-item-progress-bar">
            <div
              className="assignment-body-item-progress-bar-fill"
              style={{
                width: `${Math.round((row.progress.submitted / row.progress.total) * 100)}%`,
                backgroundColor: "var(--xl-brand)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentComponent;
