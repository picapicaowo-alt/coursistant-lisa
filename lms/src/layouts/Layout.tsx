import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import {Outlet, useLocation} from "react-router-dom";
import styles from './Layout.module.scss';
import {SIDEBAR_CONFIGS} from "@/configs/routes.config";
import {ErrorBoundary} from "@/components/ErrorBoundary";

const Layout: React.FC = () => {
  const location = useLocation();
  
  const showLayout = React.useMemo(() =>
      SIDEBAR_CONFIGS.some(c => c.path === location.pathname),
    [location]);
  
  return (
    <div className={styles.layoutContainer}>
      {showLayout && <Sidebar/>}
      <div className={styles.contentArea}>
        {showLayout && <Header/>}
        {/* Scoped to the page so a failed route keeps the shell — the user can
            still navigate somewhere else instead of facing a blank window.
            Keyed on the path so moving to another page clears the error. */}
        <main className={styles.mainContent}>
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet/>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
export default Layout;
