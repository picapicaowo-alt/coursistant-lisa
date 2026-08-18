import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import styles from './Sidebar.module.scss';
import {useTranslation} from 'react-i18next';
import {getSidebarIndex, SIDEBAR_CONFIGS} from "@/configs/routes.config";
import {useRequiredAuth} from "@/contexts/RequiredAuthContext";

const Sidebar: React.FC = () => {
  const {t} = useTranslation();
  const {user} = useRequiredAuth();
  const {pathname} = useLocation();
  const selectedSidebarIndex = getSidebarIndex(pathname);
  const isUserAccount = user.role === 'USER';
  const homePath = isUserAccount ? '/' : '/course';
  const sidebarItems = SIDEBAR_CONFIGS
    .map((item, originalIndex) => ({item, originalIndex}))
    .filter(({item}) => isUserAccount || item.path === '/course');
  
  return (
    <div className={styles.sidebar}>
      <Link
        to={homePath}
        className={styles.logo}
        aria-label={t("sidebar.dashboard")}
      >
        <img className="p-1 align-middle" src="/icons/coursistant_icon_ver2.png" alt="Logo"/>
      </Link>
      <nav>
        <ul>
          {
            sidebarItems.map(({item, originalIndex}) => (
              <Link
                key={item.path}
                to={item.path}
              >
                <div className={`${styles.itemContent} ${selectedSidebarIndex === originalIndex ? styles.active : ''}`}>
                  <img
                    src={selectedSidebarIndex === originalIndex ? item.sidebarItem.filledIcon : item.sidebarItem.unfilledIcon}
                    alt={item.name}
                    className={styles.responsiveImage}
                  />
                  <span>{!isUserAccount && item.path === '/course' ? 'Courses' : t(item.sidebarItem.translationLabel)}</span>
                </div>
              </Link>
            ))
          }
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
