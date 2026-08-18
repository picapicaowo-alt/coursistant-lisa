import React, {useState} from "react";
import {Navigate} from "react-router-dom";
import styles from "./index.module.scss"
import AnnouncementManager from "../../sections/Notification/index.jsx";
import {useWidgetLayout} from "@/pages/LmsHomePage/hooks/useWidgetLayout";
import {Dashboard} from "@/pages/LmsHomePage/components/Dashboard";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";

const LMSHome: React.FC = () => {
  const {user} = useRequiredAuth();

  if (user.role !== 'USER') {
    return <Navigate to="/course" replace/>;
  }

  return <UserDashboard/>;
};

const UserDashboard: React.FC = () => {
  const [selectedChatSection, setSelectedChatSection] = useState('ai');
  
  const {
    containerRef,
    width,
    mounted,
    widgetConfigs,
    layout,
    columns,
  } = useWidgetLayout();
  
  return (
    <div className={styles['lms-home-container']}>
      <Dashboard
        layout={layout}
        width={width}
        columns={columns}
        mounted={mounted}
        widgetConfigs={widgetConfigs}
        containerRef={containerRef}
      />
      
      <AnnouncementManager
        selectedChatSection={selectedChatSection}
        setSelectedChatSection={setSelectedChatSection}
      />
    </div>
  );
};

export default LMSHome;
