import React from "react";
import styles from "./index.module.scss";

interface HeaderAreaProps {
  title: string;
  children: React.ReactNode;
}

export const Header: React.FC<HeaderAreaProps> = ({
                                                    title,
                                                    children,
                                                  }) => {
  
  return (
    <div className={styles.headerSection}>
      <h1 className={styles.assignmentTitle}>{title}</h1>
      <div className={styles.metaInfo}>
        {children}
      </div>
    </div>
  );
};