import React from "react";
import styles from "./index.module.scss";

interface PropertyRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const PropertyRow: React.FC<PropertyRowProps> = ({
                                                          title,
                                                          description,
                                                          children,
                                                        }) => {
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {description && (<span className={styles.description}>{description}</span>)}
      </div>
      {children}
    </div>
  );
}