import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import styles from './Sidebar.module.scss';
import {useTranslation} from 'react-i18next';
import {getSidebarIndex, SIDEBAR_CONFIGS} from "@/configs/routes.config";

const Sidebar: React.FC = () => {
  const {t} = useTranslation();
  const {pathname} = useLocation();
  const selectedSidebarIndex = getSidebarIndex(pathname);
  
  return (
    <div className={styles.sidebar}>
      <Link
        to="/"
        className={styles.logo}
        aria-label={t("sidebar.dashboard")}
      >
        <img className="p-1 align-middle" src="/icons/coursistant_icon_ver2.png" alt="Logo"/>
      </Link>
      <nav>
        <ul>
          {
            SIDEBAR_CONFIGS.map((item, index) => (
              <Link
                key={index}
                to={item.path}
              >
                <div className={`${styles.itemContent} ${selectedSidebarIndex === index ? styles.active : ''}`}>
                  <img
                    src={selectedSidebarIndex === index ? item.sidebarItem.filledIcon : item.sidebarItem.unfilledIcon}
                    alt={item.name}
                    className={styles.responsiveImage}
                  />
                  <span>{t(item.sidebarItem.translationLabel)}</span>
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
