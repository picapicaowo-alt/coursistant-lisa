import React from "react";
import styles from "./index.module.scss";

interface PropertySectionProps {
  title?: string;
  columns?: number;
  children: React.ReactNode;
  transparent?: boolean;
}

export const PropertyForm: React.FC<PropertySectionProps> = ({
                                                               title = null,
                                                               columns = 1,
                                                               children,
                                                               transparent = false,
                                                             }) => {
  const columnTemplate = React.useMemo(() => {
    let c = "1fr";
    for (let i = 1; i < columns; i++) {
      c += " 1fr";
    }
    return c;
  }, [columns]);
  
  return (
    <div className={`${styles.settingsSection} ${transparent ? "" : styles.noTransparent}`}>
      {title !== null && <h3 className={styles.settingsTitle}>{title}</h3>}
      <div className={styles.settingsGrid} style={{gridTemplateColumns: columnTemplate}}>
        {children}
      </div>
    </div>
  );
}