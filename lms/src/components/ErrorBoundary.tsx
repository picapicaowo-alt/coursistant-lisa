import React from 'react';
import styles from './ErrorBoundary.module.scss';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Changing this resets the boundary — pass the route so navigating retries. */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches a render-time failure and shows something the user can act on.
 *
 * The app had none, which mattered more than it sounds: useSuspenseQuery
 * reports failures by throwing, so any failed load — an expired token, a
 * server error — unmounted the entire application and left a blank screen.
 * PRIN-02 requires every function to define what happens on failure, and
 * "the page disappears" is not that.
 *
 * This is a last line of defence. A region that can fail on its own should
 * still handle its own error inline, the way the dashboard widgets do.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {error: null};

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {error};
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    // Navigating away from a broken page should not keep showing its error.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({error: null});
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error', error, info.componentStack);
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
