import { useState, useEffect } from "react";
import styles from "./styles.module.scss";
import PostList from "../../sections/posts/post-list-profile";
import CourseComponent from "../../sections/course/course-profile-about";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext.js";
const About = () => {
    const [activeAction, setActiveAction] = useState("Learning");   
    const { user } = useAuth();
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
                    setCourseList(transformedCourses.slice(0, 6));
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        }
        fetchData();
    }, []);

    const postTemplate = 
    {
        title: "TCP mode measurement",
        time: "12:14 PM",
        postType: "Question",
        body: "In this course, we'll be teaching the concepts of the JavaScript programming language and the cool functions you can use with it in the ProcessingJS library. Before you dig in, here's a brief tour of how we teach...",
        instructor: {
        name: "Sylvia Reyes",
        role: "Instructor",
        image: "icons/course/instructor.png",
        },
        postId: "1",
        stats: {
        likes: 12,
        comments: 5,
        shares: 5,
        },
    }

    const posts = Array(8).fill(null).map(() => ({ ...postTemplate }));
    return (
        <>
        {/* Analytics Section */}
        <div className="flex flex-row mt-8 w-[90%]">
          {/* Analytics Header */}
          <div className="flex flex-col">
            <h3 className="text-2xl font-md">Analytics</h3>
            <div className="flex flex-row gap-2 items-center">
                <img className="w-4 h-4" src="/icons/profile/eye-slash.png" alt="eye-slash" />
                <span className="text-sm text-[rgba(160,174,192,1)]">private to you</span>
            </div>
          </div>
          <div className="flex-1"/>
          {/* Action Tabs */}
          <div className="flex flex-row gap-2 mr-5">
            {/* Learning Tabs */}
            <button
                onClick={() => setActiveAction('Learning')}
                className={`cursor-pointer px-4 h-10 rounded-xl text-sm font-medium ${
                activeAction === 'Learning'
                    ? 'bg-[rgba(203,213,224,1)] text-gray-800'
                    : 'text-gray-400'
                }`}
            >
                Learning
            </button>
            {/* Posts Tab */}
            <button
                onClick={() => setActiveAction('Posts')}
                className={`cursor-pointer px-4 h-10 rounded-xl text-sm font-medium ${
                activeAction === 'Posts'
                    ? 'bg-[rgba(203,213,224,1)] text-gray-800'
                    : 'text-gray-400'
                }`}
            >
            Posts
            </button>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="w-[85%] flex flex-row justify-between text-center text-gray-700 mt-10">
        {["Courses", "Project Briefs", "Assessments", "Hours Learning"].map((item, key) => (
            <div key={key}>
            <div>
                <p className="text-md mb-2 text-[rgba(160,174,192,1)]">{item}</p>
                <p className="text-2xl font-bold">0</p>
            </div>
            {item !== "Hours Learning" && <div className={styles.verticalDivider}/>}
            </div>
        ))}
        </div>
        <div className="w-[90%] mt-10">
            {/* Learning Section */}
            {activeAction == "Learning" && (
                <>
                <h3 className="text-2xl font-md">Let's start learning</h3>
                    <div className={styles.courseListContainer}>
                        {courseList.map((course, key) => (
                            <div key={key} className={styles.course}>
                                <CourseComponent {...course} />
                            </div>
                        ))}
                    </div>
                </>
            )}
            {activeAction == "Posts" && (
                <>
                    <h3 className="text-2xl font-md">My posts</h3>
                    <PostList posts={posts} />
                </>
            )}

        </div>

        </>
    )
}

export default About;