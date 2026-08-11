import React, {useState} from "react";
import styles from "./CourseComponent.module.scss";
import CourseCard from "./CourseCard";
import {useCourseList} from "@/pages/LmsHomePage/hooks/useCourseList";

// Figma shows All / Collect / HW1 pills here. Only "All" has any meaning
// against the current API — there is no favourites or per-assignment filter on
// /v2/me/courses — so the other two stay visibly disabled rather than
// pretending to filter. See open-decisions.md S-4 (course favourites).
const FILTERS = [
  {label: "All", enabled: true},
  {label: "Collect", enabled: false},
  {label: "HW1", enabled: false},
] as const;

const CourseComponent: React.FC = () => {
  const {courses, isLoading, isError, refetch} = useCourseList();
  const [selected, setSelected] = useState<string>("All");

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">My Course</h1>
        <div className="flex-1"/>
        <div className="flex gap-2">
          {FILTERS.map(({label, enabled}) => (
            <button type="button"
                    key={label}
                    disabled={!enabled}
                    title={enabled ? undefined : "Not available yet"}
                    onClick={() => setSelected(label)}
                    className={`px-4 py-1 rounded-lg font-medium transition
                            ${selected === label
                      ? "bg-[rgba(86,111,232,1)] text-white"
                      : "bg-transparent text-gray-400"}
                            ${enabled
                      ? "cursor-pointer hover:text-gray-600"
                      : "opacity-40 cursor-not-allowed"}
                        `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.horizontalLine}/>

      <CourseListBody courses={courses} isLoading={isLoading} isError={isError} refetch={refetch}/>
    </>
  );
};

type CourseListBodyProps = Pick<ReturnType<typeof useCourseList>,
  "courses" | "isLoading" | "isError" | "refetch">;

/**
 * Error and empty are deliberately separate branches. The dashboard API
 * contract says a failed region must show an error with a retry and must never
 * render as empty, because "you have no courses" and "we could not load your
 * courses" lead a user to opposite conclusions (PRIN-03).
 */
const CourseListBody: React.FC<CourseListBodyProps> = ({courses, isLoading, isError, refetch}) => {
  if (isLoading) {
    return <p className="text-sm text-gray-400 py-6 text-center">Loading courses…</p>;
  }

  if (isError) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-gray-500">Couldn&apos;t load your courses.</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-2 px-4 py-1 rounded-lg font-medium text-[rgba(86,111,232,1)] hover:underline cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        You are not enrolled in any active courses.
      </p>
    );
  }

  return (
    <div className="grid grid-cols- xl:grid-cols-2 gap-4">
      {courses.map((course) => (
        <CourseCard key={course.id} {...course} />
      ))}
    </div>
  );
};

export default CourseComponent;
