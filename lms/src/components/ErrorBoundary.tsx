import React from 'react';
import styles from './ErrorBoundary.module.scss';
import {frontendErrorReporter} from '@/utils/frontendErrorReporter';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Changing this resets the boundary — pass the route so navigating retries. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Last-resort render failure UI. Feature regions should still handle their own errors. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({error: null});
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    frontendErrorReporter.capture(error, {componentStack: info.componentStack});
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className={styles.container} role="alert">
        <h2 className={styles.title}>Something went wrong</h2>
        <p className={styles.message}>
          This page couldn&apos;t be loaded. Try again, and if it keeps
          happening, reload the page.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.retry}
            onClick={() => this.setState({error: null})}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
}
