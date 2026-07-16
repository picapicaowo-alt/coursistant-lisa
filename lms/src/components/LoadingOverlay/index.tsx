import React from "react";
import styles from "./index.module.scss";

export const LoadingOverlay: React.FC = () => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner}/>
    </div>
  );
}