import React, {Suspense, useState} from "react";
import styles from "./CourseComponent.module.scss";
import CourseCard from "./CourseCard";
import {useCourseList} from "@/pages/LmsHomePage/hooks/useCourseList";

const CourseComponent: React.FC = () => {
  const {courses} = useCourseList();
  
  const [selected, setSelected] = useState("All");
  const options = ["All", "Collect", "HW1"];
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">My Course</h1>
        <div className="flex-1"/>
        <div className="flex gap-2">
          {options.map((label) => (
            <button type="button"
                    key={label}
                    onClick={() => setSelected(label)}
                    className={`px-4 py-1 rounded-lg font-medium transition cursor-pointer
                            ${selected === label
                      ? "bg-[rgba(86,111,232,1)] text-white"
                      : "bg-transparent text-gray-400 hover:text-gray-600"}
                        `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.horizontalLine}/>
      <div className="grid grid-cols- xl:grid-cols-2 gap-4">
        {courses.map((course) => (
          <CourseCard key={course.title} {...course} />
        ))}
      </div>
    </Suspense>
  )
}

export default CourseComponent;