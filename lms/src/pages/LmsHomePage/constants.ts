import {WidgetId, WidgetLayoutConfig} from "@/pages/LmsHomePage/types";

export const SCREEN_BREAKPOINTS = {
  SMALL: 540,
  MEDIUM: 720,
  LARGE: 960,
} as const;

export const WIDGET_CONFIGS: Record<WidgetId, WidgetLayoutConfig> = {
  chat: {
    id: 'chat',
    constraints: {minW: 4, maxW: 4, minH: 12, maxH: 16},
    default: {w: 4, h: 14},
    small: {w: 4, h: 12},
    medium: {w: 4, h: 14},
    large: {w: 4, h: 16},
    defaultPosition: {x: 0, y: 0},
  },
  course: {
    id: 'course',
    constraints: {minW: 4, maxW: 12, minH: 6, maxH: 10},
    default: {w: 8, h: 8},
    small: {w: 4, h: 8},
    medium: {w: 4, h: 8},
    large: {w: 8, h: 9},
    defaultPosition: {x: 4, y: 0},
  },
  assignments: {
    id: 'assignments',
    constraints: {minW: 4, maxW: 8, minH: 5, maxH: 8},
    default: {w: 5, h: 5},
    small: {w: 4, h: 5},
    medium: {w: 4, h: 6},
    large: {w: 4, h: 7},
    defaultPosition: {x: 4, y: 9},
  },
  'learning-schedule': {
    id: 'learning-schedule',
    constraints: {minW: 3, maxW: 4, minH: 8, maxH: 13},
    default: {w: 3, h: 10},
    small: {w: 3, h: 8},
    medium: {w: 3, h: 10},
    large: {w: 4, h: 13},
    defaultPosition: {x: 8, y: 9},
  },
  'skill-graph': {
    id: 'skill-graph',
    constraints: {minW: 3, maxW: 4, minH: 4, maxH: 6},
    default: {w: 3, h: 4},
    small: {w: 4, h: 4},
    medium: {w: 3, h: 4},
    large: {w: 3, h: 6},
    defaultPosition: {x: 0, y: 16},
  },
  posts: {
    id: 'posts',
    constraints: {minW: 4, maxW: 8, minH: 4, maxH: 6},
    default: {w: 5, h: 4},
    small: {w: 4, h: 5},
    medium: {w: 5, h: 4},
    large: {w: 5, h: 6},
    defaultPosition: {x: 3, y: 16},
  },
} as const;

export const WIDGET_ORDER: WidgetId[] = [
  'chat',
  'course',
  'assignments',
  'learning-schedule',
  'posts',
  'skill-graph',
];