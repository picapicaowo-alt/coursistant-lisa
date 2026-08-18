import React from "react";
import {Navigate} from "react-router-dom";
import styles from "./index.module.scss"
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
  const {
    containerRef,
    width,
    mounted,
    widgetConfigs,
    layout,
    columns,
  } = useWidgetLayout();
  
  return (
    <main className={styles['lms-home-container']} aria-labelledby="dashboard-title">
      <h1 id="dashboard-title" className={styles.srOnly}>Dashboard</h1>
      <Dashboard
        layout={layout}
        width={width}
        columns={columns}
        mounted={mounted}
        widgetConfigs={widgetConfigs}
        containerRef={containerRef}
      />
      
    </main>
  );
};

export default LMSHome;
