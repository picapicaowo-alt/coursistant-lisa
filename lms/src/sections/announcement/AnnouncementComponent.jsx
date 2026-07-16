import React from "react";

import "./AnnouncementComponent.scss";

const AnnouncementComponent = () => {
    

  return (
    <div className="announcement-container">
        <div className="announcement-container-side"/>
        <div className="announcement-container-content">
            <h1>Announcements</h1>
            <div className="announcement-container-content-header">
                <img
                    className="announcement-container-content-header-instructor-image"
                    src="icons/course/instructor.png"
                    alt="course-icon"
                />
                <div className="announcement-container-content-header-instructor-info">
                    <h1>Sylvia Reyes</h1>
                    <p>instructor</p>
                </div>
                <div className="spacer" />
                <div className="announcement-container-content-header-time">
                    <p>12:14 PM</p>
                </div>
            </div>
            <div className="announcement-container-content-body">
                <h2>How do we collect like terms with integer coefficients?</h2>
                <p>
                    The commutative property of addition tells us that we can add numbers in any order.
                    <a href="#">View all</a>
                </p>
            </div>
        </div>
    </div>
  );
};

export default AnnouncementComponent;
