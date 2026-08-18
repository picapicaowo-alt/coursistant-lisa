import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {DeadlineDecision} from '@/apis/services/ai-agent-api';
import styles from './index.module.scss';

interface DeadlineDecisionModalProps {
  confirmationText: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onDecision: (decision: DeadlineDecision) => void;
}

const DeadlineDecisionModal = ({
  confirmationText,
  errorMessage,
  isSubmitting,
  onDecision,
}: DeadlineDecisionModalProps) => {
  const rejectButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const appRoot = document.getElementById('root');
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden') ?? null;
    const rootWasInert = appRoot?.inert ?? false;
    const previousBodyOverflow = document.body.style.overflow;

    if (appRoot) {
      appRoot.inert = true;
      appRoot.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = 'hidden';
    rejectButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (appRoot) {
        appRoot.inert = rootWasInert;
        if (previousAriaHidden === null) {
          appRoot.removeAttribute('aria-hidden');
        } else {
          appRoot.setAttribute('aria-hidden', previousAriaHidden);
        }
      }
      previouslyFocused?.focus();
    };
  }, []);

  return createPortal(
    <div className={styles.modalBackdrop}>
      <section
        className={styles.deadlineModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deadline-decision-title"
        aria-describedby="deadline-decision-copy deadline-decision-warning"
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalIcon} aria-hidden="true">!</span>
          <div>
            <span className={styles.modalEyebrow}>Action required</span>
            <h3 id="deadline-decision-title">Deadline change approval</h3>
          </div>
        </div>

        <p id="deadline-decision-copy" className={styles.modalCopy}>
          {confirmationText}
        </p>
        <p id="deadline-decision-warning" className={styles.modalWarning}>
          The deadline has not changed yet.
        </p>

        {errorMessage ? <p className={styles.modalError} role="alert">{errorMessage}</p> : null}

        <div className={styles.modalActions}>
          <button
            ref={rejectButtonRef}
            type="button"
            onClick={() => onDecision('REJECT')}
            disabled={isSubmitting}
          >
            Reject
          </button>
          <button
            type="button"
            className={styles.allowButton}
            onClick={() => onDecision('ALLOW')}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Working…' : 'Allow'}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};

export default DeadlineDecisionModal;
