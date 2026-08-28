import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import {Outlet, useLocation} from "react-router-dom";
import styles from './Layout.module.scss';
import {shouldShowAppShell} from "@/configs/routes.config";
import {ErrorBoundary} from "@/components/ErrorBoundary";
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';

const DashboardSearch = React.lazy(() => import('@/pages/LmsHomePage/components/DashboardSearch'));

const Layout: React.FC = () => {
  const location = useLocation();
  const {user} = useRequiredAuth();
  const mainContentRef = React.useRef<HTMLElement | null>(null);
  
  const showLayout = shouldShowAppShell(location.pathname);
  const isDashboard = location.pathname === '/';
  const isAssistant = location.pathname === '/aibot';
  const showGlobalSearch = showLayout && user.role === 'USER';

  React.useEffect(() => {
    // The shell's main element is the scroll container. React Router reuses it
    // between pages, so without an explicit reset a shorter destination can
    // open halfway down (and hide the AI Assistant heading).
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
  }, [location.pathname]);
  
  return (
    <div className={`${styles.layoutContainer} ${showLayout ? styles.appShell : ''}`}>
      {showLayout && <Sidebar/>}
      <div className={`${styles.contentArea} ${showLayout ? styles.appShellContent : ''}`}>
        {showLayout && (
          <Header>
            {showGlobalSearch ? (
              <React.Suspense fallback={<div className={styles.searchFallback} aria-hidden="true"/>}>
                <DashboardSearch/>
              </React.Suspense>
            ) : null}
          </Header>
        )}
        {/* Scoped to the page so a failed route keeps the shell — the user can
            still navigate somewhere else instead of facing a blank window.
            Keyed on the path so moving to another page clears the error. */}
        <main
          ref={mainContentRef}
          className={`${styles.mainContent} ${isDashboard || isAssistant ? styles.viewportPage : ''}`}
        >
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet/>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
export default Layout;
