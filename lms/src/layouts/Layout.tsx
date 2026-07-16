import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import {Outlet, useLocation} from "react-router-dom";
import styles from './Layout.module.scss';
import {SIDEBAR_CONFIGS} from "@/configs/routes.config";

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
        <main className={styles.mainContent}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
export default Layout;
