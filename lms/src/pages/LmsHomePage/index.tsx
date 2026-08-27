import React from "react";
import {Navigate} from "react-router-dom";
import styles from "./index.module.scss"
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
  return (
    <section className={styles['lms-home-container']} data-dashboard-root aria-labelledby="dashboard-title">
      <h1 id="dashboard-title" className={styles.srOnly}>Dashboard</h1>
      <Dashboard/>
    </section>
  );
};

export default LMSHome;
