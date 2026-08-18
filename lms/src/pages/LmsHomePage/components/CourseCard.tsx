import React from "react";
import {Link} from "react-router-dom";
import {DashboardCourse} from "@/pages/LmsHomePage/types";
import {formatCourseName} from "@/utils/course";

const CourseCard: React.FC<DashboardCourse> = ({
                                                 id,
                                                 courseCode,
                                                 title,
                                                 instructorName,
                                                 instructorAvatar
                                               }) => {
  return (
    <div className="rounded-2xl border border-[rgba(226,232,240,1)] p-4 flex min-w-0 flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <img
            src={instructorAvatar}
            alt=""
            className="w-10 h-10 rounded-full"
          />
          <div>
            {/* No name means the payload had only a userId. Leaving the line
                out beats printing a placeholder that reads like a real name. */}
            {instructorName && (
              <div className="font-medium text-[rgba(45,55,72,1)]">{instructorName}</div>
            )}
            <div className="text-sm text-gray-400">Instructor</div>
          </div>
        </div>
      </div>
      
      {/* Body */}
      {/* Title only. The card has no subtitle in the design — the course code
          is part of the name, and there is no second line under it. */}
      <div className="mt-2">
        <h3 className="text-lg font-medium text-[rgba(45,55,72,1)] [overflow-wrap:anywhere]">
          {formatCourseName(courseCode, title)}
        </h3>
      </div>
      
      {/* Footer */}
      <div className="mt-6 flex justify-end">
        <Link
          to={`/course/${id}`}
          className="flex min-w-[9.5rem] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[rgba(86,111,232,1)] px-4 py-2 font-medium text-white transition hover:bg-[rgba(86,111,232,0.8)]"
        >
          View details
          <img src="/icons/course/arrow-right.png" alt="arrow-right" className="w-4 h-4 ml-1"/>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
