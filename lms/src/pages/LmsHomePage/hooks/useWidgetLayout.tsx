import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {calculateLayout, getColumns, getScreenSize} from '../utils/layoutCalculations';
import {clearStoredLayout, loadStoredLayout, saveStoredLayout} from '../utils/layoutStorage';
import {useContainerWidth} from 'react-grid-layout';
import ChatComponent from "@/pages/LmsHomePage/components/ChatComponent.js";
import AssignmentComponent from "@/sections/assignments/AssignmentComponent";
import CourseComponent from "../components/CourseComponent.js";
import LearningScheduleComponent from "@/sections/learning_schedule/LearningScheduleComponent";
import PostComponent from "@/sections/posts/PostComponent";
import SkillGraphComponent from "../../../sections/skill_graph/SkillGraphComponent.jsx";
import {DEFAULT_WIDGET_INSTANCES} from "../constants";
import {
  GridLayoutItem,
  ScreenSize,
  ScreenSizeInfo,
  WidgetConfig,
  WidgetInstance,
  WidgetType,
} from "@/pages/LmsHomePage/types";

const WIDGET_COMPONENTS: Record<WidgetType, () => React.ReactNode> = {
  chat: () => <ChatComponent/>,
  course: () => <CourseComponent/>,
  assignments: () => <AssignmentComponent/>,
  'learning-schedule': () => <LearningScheduleComponent/>,
  posts: () => <PostComponent/>,
  'skill-graph': () => <SkillGraphComponent/>,
};

type SavedLayouts = Partial<Record<ScreenSize, GridLayoutItem[]>>;

interface UseWidgetLayoutResult {
  containerRef: React.RefObject<HTMLDivElement>;
  width: number;
  mounted: boolean;
  widgetConfigs: WidgetConfig[];
  layout: GridLayoutItem[];
  columns: number;
  screenSize: ScreenSizeInfo;

  /** True while the canvas is locked: no dragging, no resizing. */
  locked: boolean;
  toggleLocked: () => void;

  /** Id of the widget the toolbar acts on, or null. */
  selectedId: string | null;
  selectWidget: (id: string | null) => void;

  onLayoutChange: (next: GridLayoutItem[]) => void;
  addWidget: (type: WidgetType) => void;
  duplicateWidget: (id: string) => void;
  removeWidget: (id: string) => void;
  resetLayout: () => void;
}

/**
 * Generates an id for a widget added or copied after load.
 *
 * Default widgets use their type as their id, so anything carrying a suffix is
 * known to be a later addition. The counter keeps ids unique within a session
 * and the timestamp keeps them unique across reloads.
 */
let instanceCounter = 0;
const nextInstanceId = (type: WidgetType): string =>
  `${type}-${Date.now().toString(36)}-${instanceCounter++}`;

/** True when the canvas holds the stock widgets in unmoved positions. */
const isDefaultCanvas = (instances: WidgetInstance[], layouts: SavedLayouts): boolean => {
  const hasMovedAnything = Object.values(layouts).some((items) => items && items.length > 0);
  if (hasMovedAnything) return false;

  return instances.length === DEFAULT_WIDGET_INSTANCES.length
    && instances.every((instance, index) =>
      instance.id === DEFAULT_WIDGET_INSTANCES[index].id
      && instance.type === DEFAULT_WIDGET_INSTANCES[index].type);
};

export const useWidgetLayout = (): UseWidgetLayoutResult => {
  const stored = useRef(loadStoredLayout()).current;

  const [instances, setInstances] = useState<WidgetInstance[]>(
    stored?.instances ?? DEFAULT_WIDGET_INSTANCES
  );
  const [savedLayouts, setSavedLayouts] = useState<SavedLayouts>(stored?.layouts ?? {});
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {width, containerRef, mounted} = useContainerWidth();
  const screenSize = useMemo(() => getScreenSize(width), [width]);
  const columns = useMemo(() => getColumns(width), [width]);

  // Refs are cached per instance so a re-render does not hand the grid a new
  // ref object for a widget that has not changed.
  const refs = useRef(new Map<string, React.RefObject<HTMLDivElement>>());
  const widgetConfigs = useMemo<WidgetConfig[]>(() => instances.map(({id, type}) => {
    let ref = refs.current.get(id);
    if (!ref) {
      ref = React.createRef<HTMLDivElement>();
      refs.current.set(id, ref);
    }
    return {key: id, type, component: WIDGET_COMPONENTS[type](), ref};
  }), [instances]);

  /**
   * The arrangement in use: whatever was saved for this breakpoint, otherwise
   * the computed default. A layout saved before a widget was added would leave
   * that widget unplaced, so anything missing is appended from the default.
   */
  const layout = useMemo(() => {
    if (!mounted) return [];

    const fallback = calculateLayout({screenSize, containerWidth: width, instances});
    const saved = savedLayouts[screenSize.size];
    if (!saved || saved.length === 0) return fallback;

    const placed = new Set(saved.map((item) => item.i));
    return [...saved, ...fallback.filter((item) => !placed.has(item.i))];
  }, [mounted, screenSize, width, instances, savedLayouts]);

  // Persist whenever the canvas changes. The first pass is a read, not a
  // change, so an untouched dashboard never writes a copy of its own defaults.
  const hydrated = useRef(false);
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }

    // Nothing worth remembering means nothing stored. Writing the defaults
    // back would undo a reset — clearStoredLayout runs, state settles to the
    // defaults, and this effect would immediately save them again — and it
    // would also pin today's defaults for a user who never customised
    // anything, so a later change to the default arrangement would not reach
    // them.
    if (isDefaultCanvas(instances, savedLayouts)) {
      clearStoredLayout();
      return;
    }

    saveStoredLayout({instances, layouts: savedLayouts});
  }, [instances, savedLayouts]);

  const onLayoutChange = useCallback((next: GridLayoutItem[]) => {
    setSavedLayouts((current) => ({...current, [screenSize.size]: next}));
  }, [screenSize.size]);

  const addWidget = useCallback((type: WidgetType) => {
    const id = nextInstanceId(type);
    setInstances((current) => [...current, {id, type}]);
    setSelectedId(id);
  }, []);

  const duplicateWidget = useCallback((id: string) => {
    setInstances((current) => {
      const index = current.findIndex((instance) => instance.id === id);
      if (index === -1) return current;

      const copy = {id: nextInstanceId(current[index].type), type: current[index].type};
      // Insert beside the original so the copy appears where the user is looking.
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setInstances((current) => current.filter((instance) => instance.id !== id));
    setSavedLayouts((current) => {
      const next: SavedLayouts = {};
      (Object.keys(current) as ScreenSize[]).forEach((size) => {
        next[size] = current[size]?.filter((item) => item.i !== id);
      });
      return next;
    });
    refs.current.delete(id);
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const resetLayout = useCallback(() => {
    clearStoredLayout();
    setInstances(DEFAULT_WIDGET_INSTANCES);
    setSavedLayouts({});
    setSelectedId(null);
  }, []);

  const toggleLocked = useCallback(() => setLocked((current) => !current), []);

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    width,
    mounted,
    widgetConfigs,
    layout,
    columns,
    screenSize,
    locked,
    toggleLocked,
    selectedId,
    selectWidget: setSelectedId,
    onLayoutChange,
    addWidget,
    duplicateWidget,
    removeWidget,
    resetLayout,
  };
};
