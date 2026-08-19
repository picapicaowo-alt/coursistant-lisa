import React from "react";
import styles from "./index.module.scss";

interface IntegerInputProps {
  value: number;
  onUpdate?: (value: number) => void;
  disabled?: boolean;
  minValue?: number;
  maxValue?: number;
}

export const IntegerInput: React.FC<IntegerInputProps> = ({
                                                            value,
                                                            onUpdate,
                                                            disabled = false,
                                                            minValue = Number.MIN_SAFE_INTEGER,
                                                            maxValue = Number.MAX_SAFE_INTEGER,
                                                          }) => {
  const [innerValue, setInnerValue] = React.useState(value);
  
  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        type="button"
        onClick={() => {
          const next = innerValue - 1;
          setInnerValue(next);
          onUpdate?.(next);
        }}
        disabled={disabled}
      >
        -
      </button>
      <input
        className={styles.input}
        type="number"
        value={innerValue}
        onChange={(e) => {
          const next = parseInt(e.target.value, 10) || 0;
          setInnerValue(next);
          onUpdate?.(next);
        }}
        min={minValue}
        max={maxValue}
        disabled={disabled}
      />
      <button
        className={styles.button}
        type="button"
        onClick={() => {
          const next = innerValue + 1;
          setInnerValue(next);
          onUpdate?.(next);
        }}
        disabled={disabled}
      >
        +
      </button>
    </div>
  )
}