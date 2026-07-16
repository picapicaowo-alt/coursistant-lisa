import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {Course} from "@/pages/LmsHomePage/types";

const CourseCard: React.FC<Course> = ({
                                        id,
                                        instructor,
                                        title,
                                        subtitle,
                                        avatar
                                      }) => {
  const [isStarred, setIsStarred] = useState(false);
  const handleStarClick = () => {
    setIsStarred(!isStarred);
  };
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-[rgba(226,232,240,1)] p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <img
            src={avatar}
            alt={instructor}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="font-medium text-[rgba(45,55,72,1)]">{instructor}</div>
            <div className="text-sm text-gray-400">Instructor</div>
          </div>
        </div>
        <div className="flex gap-2.5 text-[rgba(86,111,232,1)] mt-1">
          <button aria-label="Star" onClick={handleStarClick}>
            <img src={isStarred ? "/icons/course/star-filled.png" : "/icons/course/star.png"} alt="star"
                 className="cursor-pointer"/>
          </button>
          <button aria-label="Notifications">
            <img src="/icons/course/notification.png" alt="notification" className="cursor-pointer"/>
          </button>
        </div>
      </div>
      
      {/* Body */}
      <div className="mt-2">
        <h3 className="text-lg font-medium text-[rgba(45,55,72,1)]">{title}</h3>
        <p className="text-sm text-[rgba(113,128,150,1)] mt-1">{subtitle}</p>
      </div>
      
      {/* Footer */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => navigate(`/course/${id}`)}
          className=" bg-[rgba(86,111,232,1)] text-white px-4 py-2 rounded-xl max-w-[150px] w-full font-medium flex justify-center items-center gap-2 hover:bg-[rgba(86,111,232,0.8)] cursor-pointer transition"
        >
          View details
          <img src="/icons/course/arrow-right.png" alt="arrow-right" className="w-4 h-4 ml-1"/>
        </button>
      </div>
    </div>
  );
};

export default CourseCard;