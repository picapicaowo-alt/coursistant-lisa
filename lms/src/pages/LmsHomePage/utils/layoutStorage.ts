import {GridLayoutItem, ScreenSize, WidgetInstance} from '@/pages/LmsHomePage/types';
import {WIDGET_CONFIGS} from '../constants';

/**
 * Dashboard arrangement persistence.
 *
 * Local only, and deliberately so: no endpoint stores a widget layout, and the
 * dashboard API has no concept of one. Until a server side exists, an
 * arrangement follows the browser rather than the account — so it does not
 * survive a different machine, and templates (which would have to be shared)
 * are not offered at all. See open-decisions.md S-1.
 */
const STORAGE_KEY = 'xlearn.dashboard.layout.v1';

/**
 * Layouts are kept per breakpoint. One saved arrangement replayed at every
 * width would drop widgets outside the narrower grids, so each size keeps its
 * own and an untouched size simply falls back to the computed default.
 */
interface StoredLayout {
  instances: WidgetInstance[];
  layouts: Partial<Record<ScreenSize, GridLayoutItem[]>>;
}

const isWidgetInstance = (value: unknown): value is WidgetInstance => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<WidgetInstance>;
  return typeof candidate.id === 'string'
    && typeof candidate.type === 'string'
    && candidate.type in WIDGET_CONFIGS;
};

const isLayoutItem = (value: unknown): value is GridLayoutItem => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<GridLayoutItem>;
  return typeof candidate.i === 'string'
    && typeof candidate.x === 'number'
    && typeof candidate.y === 'number'
    && typeof candidate.w === 'number'
    && typeof candidate.h === 'number';
};

/**
 * Reads the saved arrangement, or null when there is nothing usable.
 *
 * Everything is validated rather than trusted. This is user-writable storage
 * that also outlives code changes — a widget type can disappear between
 * releases — and a malformed entry would otherwise crash the dashboard on
 * load with no way for the user to recover.
 */
export const loadStoredLayout = (): StoredLayout | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const {instances, layouts} = parsed as Partial<StoredLayout>;
    if (!Array.isArray(instances) || !instances.every(isWidgetInstance)) return null;
    if (instances.length === 0) return null;

    const validLayouts: Partial<Record<ScreenSize, GridLayoutItem[]>> = {};
    if (typeof layouts === 'object' && layouts !== null) {
      (Object.keys(layouts) as ScreenSize[]).forEach((size) => {
        const items = layouts[size];
        if (Array.isArray(items) && items.every(isLayoutItem)) {
          // Drop positions for widgets that are no longer on the canvas, so a
          // stale entry cannot resurrect a removed widget.
          validLayouts[size] = items.filter(
            (item) => instances.some((instance) => instance.id === item.i)
          );
        }
      });
    }

    return {instances, layouts: validLayouts};
  } catch {
    return null;
  }
};

/** Persists the arrangement. Failure is ignored — storage can be full or off. */
export const saveStoredLayout = (stored: StoredLayout): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private browsing or a full quota. Losing the arrangement is acceptable;
    // breaking the dashboard over it is not.
  }
};

/** Forgets the arrangement so the canvas returns to its default. */
export const clearStoredLayout = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing useful to do.
  }
};
