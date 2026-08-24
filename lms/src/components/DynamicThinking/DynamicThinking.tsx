import {useEffect, useState} from 'react';
import styles from './DynamicThinking.module.scss';

export interface ThinkingStep {
  id: string;
  text: string;
}

interface DynamicThinkingProps {
  /**
   * Streaming integrations can append high-level status summaries here.
   * Never pass raw model chain-of-thought.
   */
  steps?: readonly ThinkingStep[];
  fallbackSteps?: readonly ThinkingStep[];
  label?: string;
}

const DEFAULT_FALLBACK_STEPS: readonly ThinkingStep[] = [
  {id: 'understand', text: 'Understanding your request.'},
  {id: 'context', text: 'Reviewing the relevant context.'},
  {id: 'response', text: 'Preparing a clear response.'},
];

const STEP_REVEAL_INTERVAL_SECONDS = 4;

const DynamicThinking = ({
  steps = [],
  fallbackSteps = DEFAULT_FALLBACK_STEPS,
  label = 'AI is thinking',
}: DynamicThinkingProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const streamedSteps = steps.filter(step => step.text.trim());
  const safeFallbackSteps = fallbackSteps.filter(step => step.text.trim());
  const fallbackCount = Math.min(
    safeFallbackSteps.length,
    1 + Math.floor(elapsedSeconds / STEP_REVEAL_INTERVAL_SECONDS),
  );
  const visibleSteps = streamedSteps.length > 0
    ? streamedSteps
    : safeFallbackSteps.slice(0, fallbackCount);
  const activeStep = visibleSteps[visibleSteps.length - 1];

  return (
    <section
      className={styles.container}
      aria-label="AI response progress"
      aria-busy="true"
    >
      <div className={styles.header} aria-hidden="true">
        <span>{label}</span>
        <span className={styles.elapsed}>· {elapsedSeconds}s</span>
      </div>

      <ol className={styles.steps} aria-hidden="true">
        {visibleSteps.map((step, index) => {
          const isActive = index === visibleSteps.length - 1;
          return (
            <li className={isActive ? styles.activeStep : styles.completedStep} key={step.id}>
              <span className={styles.marker} />
              <span>{step.text}</span>
            </li>
          );
        })}
      </ol>

      <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {activeStep ? `${label}: ${activeStep.text}` : label}
      </span>
    </section>
  );
};

export default DynamicThinking;
