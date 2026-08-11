import React, {useMemo, useState} from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import "./LearningScheduleComponent.scss";
import {useDashboardActivities, ACTIVITY_WINDOW_DAYS} from "@/pages/LmsHomePage/hooks/useDashboardActivities";
import {UpcomingActivity} from "@/apis";

const DATE_KEY = "yyyy-MM-dd";

const ActivityIcon: React.FC<{source: UpcomingActivity["source"]}> = ({source}) => (
  <svg className="mr-2 ml-1" width="24" height="24" viewBox="0 0 24 24" fill="none"
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {source === "CourseEvent" ? (
      <>
        <path d="M7 2V5" stroke="var(--xl-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M17 2V5" stroke="var(--xl-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="var(--xl-brand)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 10H16" stroke="var(--xl-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ) : (
      <path
        d="M10.0495 2.53028L4.02953 6.46028C2.09953 7.72028 2.09953 10.5403 4.02953 11.8003L10.0495 15.7303C11.1295 16.4403 12.9095 16.4403 13.9895 15.7303L19.9795 11.8003C21.8995 10.5403 21.8995 7.73028 19.9795 6.47028L13.9895 2.54028C12.9095 1.82028 11.1295 1.82028 10.0495 2.53028Z"
        stroke="var(--xl-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    )}
  </svg>
);

/**
 * Learning Schedule widget.
 *
 * The Figma design is a month calendar with free navigation, but the API only
 * looks forward and only 30 days at a time. Rather than render an empty grid
 * for months it knows nothing about — which would read as "no classes" — the
 * widget marks the covered range and says plainly where its knowledge stops.
 */
const LearningScheduleComponent: React.FC = () => {
  const {activities, coveredFrom, coveredTo, isLoading, isError, refetch} = useDashboardActivities();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const byDate = useMemo(() => {
    const map = new Map<string, UpcomingActivity[]>();
    activities.forEach((activity) => {
      const existing = map.get(activity.date);
      if (existing) {
        existing.push(activity);
      } else {
        map.set(activity.date, [activity]);
      }
    });
    return map;
  }, [activities]);

  const isCovered = (dateKey: string) => dateKey >= coveredFrom && dateKey <= coveredTo;

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, {weekStartsOn: 1});
    const gridEnd = endOfWeek(endOfMonth(monthStart), {weekStartsOn: 1});

    const weeks: React.ReactNode[] = [];
    let days: React.ReactNode[] = [];
    let day = gridStart;

    while (day <= gridEnd) {
      for (let i = 0; i < 7; i++) {
        const thisDay = day;
        const dateKey = format(thisDay, DATE_KEY);
        const isSelected = isSameDay(thisDay, selectedDate);
        const inMonth = isSameMonth(thisDay, monthStart);
        const hasActivity = byDate.has(dateKey);

        days.push(
          <div
            key={dateKey}
            onClick={() => setSelectedDate(thisDay)}
            className={`ml-1 h-8 w-8 flex items-center justify-center text-sm cursor-pointer relative transition
              ${isSelected ? "text-white font-semibold rounded-xl" : ""}
              ${!inMonth ? "opacity-40" : ""}`}
            style={isSelected ? {backgroundColor: "var(--xl-brand)"} : undefined}
          >
            {format(thisDay, "d")}
            {hasActivity && (
              <span
                className="absolute bottom-1 w-1 h-1 rounded-full"
                style={{backgroundColor: isSelected ? "#FFFFFF" : "var(--xl-brand)"}}
              />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      weeks.push(<div key={format(day, DATE_KEY)} className="grid grid-cols-7">{days}</div>);
      days = [];
    }

    return <div className="space-y-2">{weeks}</div>;
  };

  const renderItems = () => {
    if (isLoading) {
      return <p className="text-center text-sm">Loading schedule…</p>;
    }

    if (isError) {
      return (
        <div className="text-center text-sm">
          <p>Couldn&apos;t load your schedule.</p>
          <button type="button" onClick={refetch} className="text-primary-color underline cursor-pointer mt-1">
            Retry
          </button>
        </div>
      );
    }

    const dateKey = format(selectedDate, DATE_KEY);

    // Outside the window the answer is "we don't know", not "nothing". Saying
    // "No scheduled sessions" here would be a false state.
    if (!isCovered(dateKey)) {
      return (
        <p className="text-center text-sm opacity-70">
          Only the next {ACTIVITY_WINDOW_DAYS} days are available.
        </p>
      );
    }

    const items = byDate.get(dateKey) ?? [];

    if (items.length === 0) {
      return <p className="text-center text-sm opacity-70">No scheduled sessions</p>;
    }

    return items.map((activity) => (
      <div className="schedule-item" key={`${activity.source}-${activity.sourceId}-${activity.startTime}`}>
        <ActivityIcon source={activity.source}/>
        <div className="schedule-item-content">
          <h3>{activity.title}</h3>
          <p>
            {activity.startTime.slice(0, 5)} - {activity.endTime.slice(0, 5)}
            {activity.location ? ` · ${activity.location}` : ""}
          </p>
        </div>
        <div className="spacer"/>
        <span className="text-xs opacity-70">{activity.courseCode}</span>
      </div>
    ));
  };

  return (
    <div className="learning-schedule-container">
      <div className="flex justify-between items-center">
        <h1 className="font-semibold text-[1.2rem] text-primary-color ml-1">Learning Schedule</h1>
      </div>
      <div className="horizontal-line"/>
      <div className="schedule-container">
        <div className="min-w-[300px] w-1/2 p-3 mx-auto mt-[-0.5rem]">
          <div className="flex justify-between items-center mb-4 py-1 px-3 rounded-lg border"
               style={{borderColor: "var(--xl-border)"}}>
            <button
              aria-label="Previous month"
              className="cursor-pointer"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <img src="icons/schedule/arrow-left.png" alt=""/>
            </button>
            <h2 className="text-lg font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
            <button
              aria-label="Next month"
              className="cursor-pointer"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <img src="icons/schedule/arrow-right.png" alt=""/>
            </button>
          </div>

          <div className="mb-2">
            <div className="grid grid-cols-7 text-center text-sm">
              {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
                <div key={index}>{label}</div>
              ))}
            </div>
          </div>

          {renderCells()}
        </div>
        <div className="horizontal-line"/>
        <div className="schedule-items">{renderItems()}</div>
      </div>
    </div>
  );
};

export default LearningScheduleComponent;
