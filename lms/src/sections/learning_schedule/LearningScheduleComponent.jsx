import {useState, useEffect} from "react";
import axios from "axios";
import {useAuth} from "@/contexts/AuthContext.js";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  subMonths,
  addMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import "./LearningScheduleComponent.scss";


const renderIcon = (type) => {
  switch (type) {
    case "course":
      return (
        <svg className="mr-2 ml-1" width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.0495 2.53028L4.02953 6.46028C2.09953 7.72028 2.09953 10.5403 4.02953 11.8003L10.0495 15.7303C11.1295 16.4403 12.9095 16.4403 13.9895 15.7303L19.9795 11.8003C21.8995 10.5403 21.8995 7.73028 19.9795 6.47028L13.9895 2.54028C12.9095 1.82028 11.1295 1.82028 10.0495 2.53028Z"
            stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path
            d="M5.62914 13.0801L5.61914 17.7701C5.61914 19.0401 6.59914 20.4001 7.79914 20.8001L10.9891 21.8601C11.5391 22.0401 12.4491 22.0401 13.0091 21.8601L16.1991 20.8001C17.3991 20.4001 18.3791 19.0401 18.3791 17.7701V13.1301"
            stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21.4004 15V9" stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "personal":
      return (
        <svg className="mr-2 ml-1" width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M7 2V5" stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 2V5" stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="5" width="18" height="16" rx="2" stroke="#566FE8" strokeWidth="2" strokeLinecap="round"
                strokeLinejoin="round"/>
          <path d="M8 10H16" stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 14H12" stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      
      
      );
    case "assignment":
      return (
        <svg className="mr-2 ml-1" width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M21 7V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V7C3 4 4.5 2 8 2H16C19.5 2 21 4 21 7Z"
                stroke="#F27316" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.5 4.5V6.5C14.5 7.6 15.4 8.5 16.5 8.5H18.5" stroke="#F27316" strokeWidth="2" strokeMiterlimit="10"
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 13H12" stroke="#F27316" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"
                strokeLinejoin="round"/>
          <path d="M8 17H16" stroke="#F27316" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"
                strokeLinejoin="round"/>
        </svg>
      
      
      );
    default:
      return (
        <svg className="mr-2 ml-1" width="24" height="24" viewBox="0 0 24 24" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.0495 2.53028L4.02953 6.46028C2.09953 7.72028 2.09953 10.5403 4.02953 11.8003L10.0495 15.7303C11.1295 16.4403 12.9095 16.4403 13.9895 15.7303L19.9795 11.8003C21.8995 10.5403 21.8995 7.73028 19.9795 6.47028L13.9895 2.54028C12.9095 1.82028 11.1295 1.82028 10.0495 2.53028Z"
            stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path
            d="M5.62914 13.0801L5.61914 17.7701C5.61914 19.0401 6.59914 20.4001 7.79914 20.8001L10.9891 21.8601C11.5391 22.0401 12.4491 22.0401 13.0091 21.8601L16.1991 20.8001C17.3991 20.4001 18.3791 19.0401 18.3791 17.7701V13.1301"
            stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21.4004 15V9" stroke="#566FE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      
      );
  }
};

const LearningScheduleComponent = () => {
  const API_DOMAIN = import.meta.env.VITE_CALENDAR_API_DOMAIN_NAME;
  const {user} = useAuth();
  
  const HEADERS = {
    "token": user.accessToken,
    "X-Timezone": "America/Los_Angeles",
  };
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleItems, setScheduleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  
  const fetchSchedule = async () => {
    const startDate = subMonths(currentMonth, 4);
    const endDate = addMonths(currentMonth, 4);
    
    const monthStart = format(startOfMonth(startDate), "yyyy-MM-dd 00:00:00");
    const monthEnd = format(endOfMonth(endDate), "yyyy-MM-dd 23:59:59");
    
    const params = {
      id: user.id,
      start: monthStart,
      end: monthEnd,
      type: user.level.toLowerCase(),
    };
    
    try {
      const response = await axios.get(`${API_DOMAIN}/calendar/selectUnifiedById`, {params, headers: HEADERS});
      
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setScheduleItems(response.data.data);
      } else {
        console.warn("Unexpected data format:", response.data);
        setScheduleItems([]);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
      setScheduleItems([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSchedule();
  }, [currentMonth, user.id]);
  
  const renderHeader = () => (
    <div className="flex justify-between items-center mb-4 py-1 px-3 rounded-lg border border-[rgba(226,232,240,1)]">
      <button
        aria-label="Previous Month"
        className="hover:text-indigo-600 focus:outline-none cursor-pointer"
        onClick={() => {
          setCurrentMonth(subMonths(currentMonth, 1));
          setSelectedDate(null);
        }}
      >
        <img src="icons/schedule/arrow-left.png" alt="arrow-left"/>
      </button>
      <h2 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
      <button
        aria-label="Next Month"
        className="hover:text-indigo-600 focus:outline-none cursor-pointer"
        onClick={() => {
          setCurrentMonth(addMonths(currentMonth, 1));
          setSelectedDate(null);
        }}
      >
        <img src="icons/schedule/arrow-right.png" alt="arrow-right"/>
      </button>
    </div>
  );
  
  const renderDays = () => {
    const days = ["M", "T", "W", "T", "F", "S", "S"];
    return (
      <div className="mb-2">
        <div className="grid grid-cols-7 text-center text-sm text-[#2D3748]">
          {days.map((day, idx) => (
            <div key={idx}>{day}</div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, {weekStartsOn: 1});
    const endDate = endOfWeek(monthEnd, {weekStartsOn: 1});
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "d");
        const dateStr = format(day, "yyyy-MM-dd");
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isEvent = scheduleItems.some(
          (item) => format(new Date(item.start), "yyyy-MM-dd") === dateStr
        );
        const isCurrentMonth = isSameMonth(day, monthStart);
        const thisDay = day;
        days.push(
          <div
            key={formattedDate}
            onClick={() => setSelectedDate(thisDay)}
            className={`ml-1 h-8 w-8 flex items-center justify-center text-sm cursor-pointer relative
              ${isSelected ? "bg-[rgba(86,111,232,1)] text-white font-semibold rounded-xl" : ""}
              ${!isCurrentMonth ? "text-[#A0AEC0]" : "text-[#2D3748] font-lite"}
              transition`}
          >
            {formattedDate}
            {isEvent && (
              <span className="absolute bottom-1 w-1 h-1 bg-[rgba(86,111,232,1)] rounded-full"/>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={`week-${day}`} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    
    return <div className="space-y-2">{rows}</div>;
  };
  
  const renderScheduleItems = () => {
    if (loading) {
      return <p>Loading schedule...</p>;
    }
    
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    const filteredItems = scheduleItems.filter(
      (item) => format(new Date(item.start), "yyyy-MM-dd") === selectedDateStr
    );
    
    const scheduleItemsContent = filteredItems.length > 0 ? (
      filteredItems.map((item, idx) => (
        <div className="schedule-item" key={idx}>
          {renderIcon(item.type)}
          <div className="schedule-item-content">
            <h3>{item.title}</h3>
            <p>
              {format(new Date(item.start), "hh:mm a")} - {format(new Date(item.end), "hh:mm a")}
            </p>
          </div>
          <div className="spacer"></div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16.19 2H7.81C4.17 2 2 4.17 2 7.81V16.18C2 19.83 4.17 22 7.81 22H16.18C19.82 22 21.99 19.83 21.99 16.19V7.81C22 4.17 19.83 2 16.19 2ZM16.78 9.7L11.11 15.37C10.97 15.51 10.78 15.59 10.58 15.59C10.38 15.59 10.19 15.51 10.05 15.37L7.22 12.54C6.93 12.25 6.93 11.77 7.22 11.48C7.51 11.19 7.99 11.19 8.28 11.48L10.58 13.78L15.72 8.64C16.01 8.35 16.49 8.35 16.78 8.64C17.07 8.93 17.07 9.4 16.78 9.7Z"
              fill="#48BB78"/>
          </svg>
        
        </div>
      ))
    ) : (
      <p className="text-center text-[#A0AEC0] text-sm">No scheduled sessions</p>
    );
    
    return (
      <>
        {scheduleItemsContent}
        <button
          className="w-full flex items-center justify-center p-4 mb-4 mt-4 border-2 border-dashed border-[#EDF2F7] rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
          <div className="w-6 h-6 mr-3 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" rx="5" fill="#EDF2F7"/>
              <path d="M8 12H16M12 16L12 8" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
          
          </div>
          <span className="font-medium text-[#A0AEC0] cursor-pointer">Add new Schedule</span>
        </button>
      </>
    );
  };
  
  return (
    <div className="learning-schedule-container">
      <div className="flex justify-between items-center ">
        <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">Learning Schedule</h1>
        <svg className="mr-2" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.75 16.5H11.25C15 16.5 16.5 15 16.5 11.25V6.75C16.5 3 15 1.5 11.25 1.5H6.75C3 1.5 1.5 3 1.5 6.75V11.25C1.5 15 3 16.5 6.75 16.5Z"
            stroke="#566FE8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.5 4.5L4.5 13.5" stroke="#566FE8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.5 7.5V4.5H10.5" stroke="#566FE8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4.5 10.5V13.5H7.5" stroke="#566FE8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="horizontal-line"></div>
      <div className="schedule-container">
        <div className="min-w-[300px] w-1/2 p-3 mx-auto mt-[-0.5rem]">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>
        <div className="horizontal-line"></div>
        <div className="schedule-items">{renderScheduleItems()}</div>
      </div>
    </div>
  );
};

export default LearningScheduleComponent;
