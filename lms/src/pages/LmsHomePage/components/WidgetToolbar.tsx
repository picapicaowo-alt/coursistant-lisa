import React, {useEffect, useRef, useState} from "react";
import styles from "./WidgetToolbar.module.scss";

interface WidgetToolbarProps {
  locked: boolean;
  onToggleLock: () => void;
  /** Null when nothing is selected; the per-widget actions need a target. */
  selectedId: string | null;
  onDuplicate: () => void;
  onDelete: () => void;
  onReset: () => void;
}

const Icon: React.FC<{path: React.ReactNode; label: string}> = ({path, label}) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-label={label}>
    {path}
  </svg>
);

/**
 * The canvas toolbar.
 *
 * Actions that operate on a widget need one selected, so they stay disabled
 * until the user clicks a tile. Two controls from the design are missing on
 * purpose:
 *
 *  - "Save as template" would have to store an arrangement server-side and
 *    share it. No endpoint exists, so it is shown disabled rather than
 *    silently doing nothing.
 *  - The two layout-preset icons and the expand icon have no defined
 *    behaviour anywhere in the spec — see open-decisions.md S-11.
 *
 * The reset action is not in the design. Without it a user who drags the
 * canvas into an unusable state has no way back, because the arrangement is
 * persisted.
 */
const WidgetToolbar: React.FC<WidgetToolbarProps> = ({
                                                       locked,
                                                       onToggleLock,
                                                       selectedId,
                                                       onDuplicate,
                                                       onDelete,
                                                       onReset,
                                                     }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const runOnSelected = (action: () => void) => () => {
    action();
    setMenuOpen(false);
  };

  return (
    <div className={styles.toolbar} ref={menuRef}>
      <button
        type="button"
        className={styles.button}
        onClick={onToggleLock}
        aria-pressed={locked}
        title={locked ? "Unlock the layout" : "Lock the layout"}
      >
        <Icon
          label={locked ? "Locked" : "Unlocked"}
          path={locked ? (
            <>
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </>
          ) : (
            <>
              <rect x="5" y="11" width="14" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 7.5-2"/>
            </>
          )}
        />
      </button>

      <span className={styles.divider}/>

      <button
        type="button"
        className={styles.button}
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="More actions"
      >
        <Icon label="More actions" path={
          <>
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </>
        }/>
      </button>

      {menuOpen && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            disabled={!selectedId}
            title={selectedId ? undefined : "Select a widget first"}
            onClick={runOnSelected(onDuplicate)}
          >
            Copy
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            disabled
            title="Templates need a server to store them"
          >
            Save as template
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${styles.menuItem} ${styles.danger}`}
            disabled={!selectedId}
            title={selectedId ? undefined : "Select a widget first"}
            onClick={runOnSelected(onDelete)}
          >
            Delete
          </button>
          <span className={styles.menuDivider}/>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={runOnSelected(onReset)}
          >
            Reset layout
          </button>
        </div>
      )}
    </div>
  );
};

export default WidgetToolbar;
