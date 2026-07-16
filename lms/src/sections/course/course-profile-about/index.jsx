import React, { useState } from "react";
import styles from "./styles.module.scss"; // Import the SCSS file

const CourseComponent = ({
    title = "Course Title",
    units = "0",
    skills = "0",
    progress = 40, // number from 0 to 100
    timeLeft = "0 hours",
  }) => {
  
    return (
      <div className={styles.courseContainer}>
        <h1 className="mt-0 text-xl">{title}</h1>
        <p>{units} UNITS · {skills} SKILLS</p>
        <div className={styles.courseProgressBar}>
          <div
            className={styles.courseProgressBarFill}
            style={{ width: `${progress}%`, backgroundColor: "#566FE8" }}
          />
        </div>
        <div className={styles.courseDescription}>
          <p className={styles.courseRating}>{progress}% complete</p>
          <img src="icons/course/clock-light.png" alt="clock-icon" />
          <p className={styles.courseLightText}>{timeLeft} left</p>
        </div>
        <span className={styles.horizontalDivider} />
        <div className={styles.courseButton}>
          Resume Course
          <img src="icons/course/arrow-right.png" alt="arrow-right" />
        </div>
      </div>
    );
  };
  
  export default CourseComponent;
