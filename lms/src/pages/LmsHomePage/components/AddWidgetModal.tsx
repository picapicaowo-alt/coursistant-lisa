import React, {useEffect, useState} from "react";
import styles from "./AddWidgetModal.module.scss";
import {ADD_WIDGET_OPTIONS} from "../constants";
import {WidgetType} from "@/pages/LmsHomePage/types";

interface AddWidgetModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (type: WidgetType) => void;
}

/**
 * Add Widget dialog.
 *
 * The design offers four tiles. Content has no widget and no endpoint behind
 * it, so its tile renders unavailable instead of being dropped — leaving a
 * three-tile grid would look like a layout bug rather than a missing feature.
 * The AI Power badge on Assignments is not reproduced: there is no AI in V1
 * (open-decisions.md B-4) and the badge would advertise something absent.
 */
const AddWidgetModal: React.FC<AddWidgetModalProps> = ({open, onClose, onCreate}) => {
  const [selected, setSelected] = useState<WidgetType | null>(null);

  // Start each opening from a clean slate rather than the previous choice.
  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const create = () => {
    if (!selected) return;
    onCreate(selected);
    onClose();
  };

  return (
    // The design blurs the backdrop rather than dimming it.
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-widget-title"
      >
        <div className={styles.header}>
          <h2 id="add-widget-title" className={styles.title}>Add Widget</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18"/>
            </svg>
          </button>
        </div>

        <div className={styles.grid}>
          {ADD_WIDGET_OPTIONS.map((option) => {
            const isSelected = option.available && option.type === selected;
            return (
              <button
                type="button"
                key={option.label}
                disabled={!option.available}
                aria-pressed={isSelected}
                onClick={() => option.type && setSelected(option.type)}
                className={[
                  styles.tile,
                  isSelected ? styles.tileSelected : '',
                  option.available ? '' : styles.tileDisabled,
                ].filter(Boolean).join(' ')}
              >
                <span className={`${styles.tileIcon} ${option.iconClass}`} aria-hidden="true"/>
                <span className={styles.tileLabel}>{option.label}</span>
                <span className={styles.tileDescription}>{option.description}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancel} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.create} onClick={create} disabled={!selected}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
