import { useState, useEffect } from "react";
import CourseComponent from "../../sections/course/course-profile-about";
import styles from "./styles.module.scss";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext.js";

const MyCourse = () => {
    const VITE_COURSE_API_DOMAIN_NAME = import.meta.env.VITE_COURSE_API_DOMAIN_NAME;
    const courseTemplate = {
        title: "[CS01] Computer Science",
        progress: 40,
        timeLeft: "3 hours",
        units: "8",
        skills: "95",
        id: 1
    }
    const [courseList, setCourseList] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${VITE_COURSE_API_DOMAIN_NAME}/course/selectByUserId/${user.id}`, {
                    headers: {
                        'token': user.accessToken
                    }
                });
                if (response.data.data) {
                    const transformedCourses = response.data.data.map(course => ({
                        id: course.id,
                        title: course.name,
                        progress: courseTemplate.progress,
                        timeLeft: courseTemplate.timeLeft,
                        units: courseTemplate.units,
                        skills: courseTemplate.skills,
                    }));
                    setCourseList(transformedCourses);
            }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="w-[90%] mt-10">
            {/* Title */}
            <div className="flex flex-row justify-between">
                <h3 className="text-2xl font-md">My course</h3>
                <button
                    className="inline-flex justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                    <span className="text-[rgba(160,174,192,1)]">Filter</span>
                    <img className="ml-3" src="/icons/roster/sort.png" alt="sort" />
                </button>
            </div>
            {/* Course List */}
            <div className={styles.courseListContainer}>
                {courseList.map((course, index) => (
                    <div key={index} className={styles.course}>
                        <CourseComponent {...course} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyCourse;