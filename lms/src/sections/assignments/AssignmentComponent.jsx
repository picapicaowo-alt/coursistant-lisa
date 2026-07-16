import { useState, useEffect, useRef } from "react";
import axios from "axios";
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; // ✅ this comes from the main dayjs package
dayjs.extend(advancedFormat);
import { useNavigate } from "react-router-dom";
import "./AssignmentComponent.scss"; // Import the SCSS fileimport { getToken } from "../../utils/getToken";
import { useAuth } from "../../contexts/AuthContext.js";
const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
const AssignmentComponent = () => {
    const API_DOMAIN = import.meta.env.VITE_API_DOMAIN_NAME;
    const { user } = useAuth();
    const [courseId, setCourseId] = useState(null);
    const navigate = useNavigate();
    const assignmentItemTemplate = [
        {
            type: "Homework",
            course: "[CS01] Social Practice",
            dueDate: "March 10th 23:59",
            dueDateStatus: "gray", // or "gray"
            progress: "0/0",
            progressBarWidth: "0%",
            progressBar: true,
            progressBarColor: "#566FE8",
            actionText: "Resources",
            actionIcon: "icons/assignments/arrow-right.png",
        },
        {
            type: "Homework",
            course: "[CS01] Social Practice",
            dueDate: "March 10th 23:59",
            dueDateStatus: "green",
            progress: "Not rated",
            progressBar: false,
            progressBarWidth: "0%",
            actionText: "Submit",
            actionIcon: "icons/assignments/submit.png",
        },
        {
            type: "Homework",
            course: "[CS01] Social Practice",
            dueDate: "March 10th 23:59",
            dueDateStatus: "red",
            progress: "N/A",
            progressBar: true,
            progressBarWidth: "40%",
            progressBarColor: "#F56565",
            actionText: "Submit",
            actionIcon: "icons/assignments/submit.png",
        },
        // Add more here...
    ];
    const [assignmentItems, setAssignmentItems] = useState([]);
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const courseInfo = await axios.get(`${API_DOMAIN}/course/selectByUserId/${user.id}`, {
                    headers: {
                        'token': user.accessToken,
                        'X-Timezone': getBrowserTimeZone(),

                    }
                });
                setAssignmentOptions(courseInfo.data.data.map(course => { return { courseName: course.name, courseId: course.id } }));
                const courseId = courseInfo.data.data[0].id;
                setCourseId(courseId);
                if (courseInfo.data.data.length > 0) {
                    const response = await axios.get(`${API_DOMAIN}/assignment/selectByCourseId/${courseId}`, {
                        headers: {
                            'token': user.accessToken,
                            'X-Timezone': getBrowserTimeZone(),

                        }
                    });
                    // console.log("🧾 response", response);
                    if (response.data.data) {
                        const transformedAssignments = response.data.data.map(assignment => ({
                        type: assignmentItemTemplate[0].type,
                        course: assignment.title,
                        // dueDate: assignmentItemTemplate[0].dueDate,
                        dueDate: assignment.due,
                        dueDateStatus: assignment.dueDateStatus,
                        progress: assignmentItemTemplate[0].progress,
                        progressBar: assignmentItemTemplate[0].progressBar,
                        progressBarWidth: assignmentItemTemplate[0].progressBarWidth,
                        progressBarColor: assignmentItemTemplate[0].progressBarColor,
                        actionText: assignmentItemTemplate[0].actionText,
                        actionIcon: assignmentItemTemplate[0].actionIcon,
                    }));
                    setAssignmentItems(transformedAssignments.slice(0, 3));
                } else {
                    setAssignmentItems([]);
                }
                    
                }
            } catch (error) {
                console.error("Error fetching assignments:", error);
            }
        };
        fetchAssignments();
    }, []);

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
  
    const [assignmentOptions, setAssignmentOptions] = useState([]);
  
    const toggleDropdown = () => {
      setIsOpen((prev) => !prev);
    };
  
    const handleSelect = async (item) => {
        await fetchAssignments(item.courseId);
        setIsOpen(false); // Close dropdown after selecting
    };

    const fetchAssignments = async (courseId) => {
        const response = await axios.get(`${API_DOMAIN}/assignment/selectByCourseId/${courseId}`, {
            headers: {
                'token': user.accessToken,
                'X-Timezone': getBrowserTimeZone(),
            }
        });
        if (response.data.data) {
            const transformedAssignments = response.data.data.map(assignment => ({
            type: assignmentItemTemplate[0].type,
            course: assignment.title,
            // dueDate: assignmentItemTemplate[0].dueDate,
            dueDate: assignment.due,
            dueDateStatus: assignment.dueDateStatus,
            progress: assignmentItemTemplate[0].progress,
            progressBar: assignmentItemTemplate[0].progressBar,
            progressBarWidth: assignmentItemTemplate[0].progressBarWidth,
            progressBarColor: assignmentItemTemplate[0].progressBarColor,
            actionText: assignmentItemTemplate[0].actionText,
            actionIcon: assignmentItemTemplate[0].actionIcon,
        }));
        setAssignmentItems(transformedAssignments.slice(0, 3));
        }
    }
    // 👇 Handle click outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
  
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);
  return (
    <div className="assignment-container">
        <div className="assignment-header">
            <div className="relative inline-block text-left" ref={dropdownRef}>
                <button
                    className="font-semibold text-[1.2rem] text-primary-color flex items-center gap-1 cursor-pointer"
                    onClick={toggleDropdown}
                >
                    Assignments <span className="text-blue-500">▾</span>
                </button>

                {isOpen && (
                    <div className="absolute mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black/5 z-10">
                    {assignmentOptions.map((item, index) => (
                        <div
                        key={index}
                        onClick={() => handleSelect(item)}
                        className="cursor-pointer px-4 py-2 hover:bg-gray-100 text-primary-color"
                        >
                        {item.courseName}
                        </div>
                    ))}
                    </div>
                )}
            </div>
            <div className="spacer" />
            <div className="assignment-header-ellipses">
                <img src="icons/assignments/ellipse_green.png" alt="ellipse_green" />
                <p>3</p>
            </div>
            <div className="assignment-header-ellipses">
                <img src="icons/assignments/ellipse_red.png" alt="ellipse_red" />
                <p>2</p>
            </div>
            <div className="assignment-header-ellipses">
                <img src="icons/assignments/ellipse_orange.png" alt="ellipse_orange" />
                <p>1</p>
            </div>
            <div className="assignment-header-see-all" onClick={() => navigate(`/course/${courseId}`)}>
                <p>See all</p>
                <img src="icons/assignments/arrow-right.png" alt="Resources" />
            </div>
        </div>
        <div className="horizontal-line" />
        <div className="assignment-body">
            {assignmentItems.length > 0 ? (
                assignmentItems.map((item, index) => (
                    <div className="assignment-body-item" key={index}>
                        <div className="assignment-body-item-course">
                <div className="assignment-body-item-course-header">
                    <img src="icons/assignments/ellipse_blue.png" alt="ellipse_blue" />
                    <p>{item.type}</p>
                </div>
                <p>{item.course}</p>
            </div>

            <div className="assignment-body-item-due-date">
                <div className="assignment-body-item-due-date-header">
                <p>Due Date</p>
                </div>
                <div
                className={`assignment-body-item-due-date-date due-${item.dueDateStatus}`}
                >
                { dayjs(item.dueDate).format('MMM Do, HH:mm') }
                </div>
            </div>

            <div className="assignment-body-item-progress">
                <div className="assignment-body-item-progress-header">
                <p>{item.progress}</p>
                </div>
                <div className="assignment-body-item-progress-bar">
                    {item.progressBar && (
                        <div className="assignment-body-item-progress-bar-fill" style={{ width: item.progressBarWidth, backgroundColor: item.progressBarColor }} />
                    )}
                </div>
            </div>

            <div className={`assignment-body-item-resources ${item.actionText === "Resources" ? "resources" : "submit"}`}>
                <p>{item.actionText}</p>
                <img src={item.actionIcon} alt={item.actionText.toLowerCase()} />
            </div>
            </div>
        ))
        ) : (
            <div className="assignment-body-item">
                <p>No assignments found</p>
            </div>
        )}
        </div>
        
    </div>
  );
};

export default AssignmentComponent;
