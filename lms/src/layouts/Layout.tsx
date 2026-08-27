import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import {Outlet, useLocation} from "react-router-dom";
import styles from './Layout.module.scss';
import {shouldShowAppShell} from "@/configs/routes.config";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import DashboardSearch from '@/pages/LmsHomePage/components/DashboardSearch';

const Layout: React.FC = () => {
  const location = useLocation();
  const mainContentRef = React.useRef<HTMLElement | null>(null);
  
  const showLayout = shouldShowAppShell(location.pathname);
  const isDashboard = location.pathname === '/';

  React.useEffect(() => {
    // The shell's main element is the scroll container. React Router reuses it
    // between pages, so without an explicit reset a shorter destination can
    // open halfway down (and hide the AI Assistant heading).
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [location.pathname]);
  
  return (
    <div className={`${styles.layoutContainer} ${isDashboard ? styles.dashboardLayout : ''}`}>
      {showLayout && <Sidebar compact={isDashboard}/>}
      <div className={`${styles.contentArea} ${isDashboard ? styles.dashboardContent : ''}`}>
        {showLayout && (
          <Header compact={isDashboard}>
            {isDashboard ? <DashboardSearch/> : null}
          </Header>
        )}
        {/* Scoped to the page so a failed route keeps the shell — the user can
            still navigate somewhere else instead of facing a blank window.
            Keyed on the path so moving to another page clears the error. */}
        <main ref={mainContentRef} className={styles.mainContent}>
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet/>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
export default Layout;
