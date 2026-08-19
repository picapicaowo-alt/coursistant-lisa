import React from "react";
import styles from "./index.module.scss";

interface DictionaryAreaProps {
  dictionary: Record<string, string>
}

export const DictionaryArea: React.FC<DictionaryAreaProps> = ({
                                                                dictionary
                                                              }) => {
  const keys = React.useMemo(() => {
    return Object.keys(dictionary);
  }, [dictionary]);
  if (keys.length === 0) return null;
  
  return (
    <div className={styles.container}>
      {keys.map(key => (
        <div key={key} className={styles.dictionaryItem}>
          <span className={styles.itemKey}>
            {key}
          </span>
          <span className={styles.itemValue}>
            {dictionary[key]}
          </span>
        </div>
      ))}
    </div>
  );
}