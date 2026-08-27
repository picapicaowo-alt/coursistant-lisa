import {WidgetId, WidgetLayoutConfig} from "@/pages/LmsHomePage/types";

export const SCREEN_BREAKPOINTS = {
  SMALL: 540,
  MEDIUM: 720,
  LARGE: 960,
} as const;

/**
 * Grid geometry, measured off docs/design/02-dashboard-instructor.png.
 *
 * The compact AI composer lives above this grid. At full width the canvas is
 * split into an 8-column course stack and a 4-column schedule rail.
 *
 *   x:  0                        8       12
 *       ┌────────────────────────┬────────┐
 *       │ My Course              │ Learn- │  y 0
 *       ├────────────────────────┤ ing    │
 *       │ Course work            │ Sched. │  y 9
 *       ├────────────────────────┼────────┤
 *       │ Announcements          │ Score  │  y 18
 *       └────────────────────────┴────────┘  y 27
 *
 * CARD_H is one card in the middle stack. The right rail's schedule is two of
 * them tall and the chat rail is three, which is what makes the calendar the
 * long element on the right rather than something that starts halfway down.
 *
 * One slot does not match the design yet. The bottom middle card is
 * Announcements, which the API has and Figma does not; Figma puts Group Chat
 * there. The bottom right now uses released assignment grades for the
 * selected course's five-month average for both students and teaching staff.
 */
const CARD_H = 9;
const STACK_H = CARD_H * 3;

export const WIDGET_CONFIGS: Record<WidgetId, WidgetLayoutConfig> = {
  // Main stack, top.
  course: {
    id: 'course',
    constraints: {minW: 4, maxW: 8, minH: 6, maxH: 12},
    default: {w: 8, h: CARD_H},
    small: {w: 4, h: 8},
    medium: {w: 4, h: CARD_H},
    large: {w: 8, h: CARD_H},
    defaultPosition: {x: 0, y: 0},
  },
  // Main stack, centre. The per-course list.
  assignments: {
    id: 'assignments',
    constraints: {minW: 4, maxW: 8, minH: 5, maxH: 12},
    default: {w: 8, h: CARD_H},
    small: {w: 4, h: 5},
    medium: {w: 4, h: CARD_H},
    large: {w: 8, h: CARD_H},
    defaultPosition: {x: 0, y: CARD_H},
  },
  // Main stack, bottom. Group Chat's slot in the design.
  posts: {
    id: 'posts',
    constraints: {minW: 4, maxW: 8, minH: 4, maxH: 12},
    default: {w: 8, h: CARD_H},
    small: {w: 4, h: 5},
    medium: {w: 4, h: CARD_H},
    large: {w: 8, h: CARD_H},
    defaultPosition: {x: 0, y: CARD_H * 2},
  },
  // Right rail, top. Two cards tall — the calendar plus the day's items.
  'learning-schedule': {
    id: 'learning-schedule',
    constraints: {minW: 3, maxW: 4, minH: 8, maxH: CARD_H * 2},
    default: {w: 4, h: CARD_H * 2},
    small: {w: 3, h: 8},
    medium: {w: 4, h: CARD_H * 2},
    large: {w: 4, h: CARD_H * 2},
    defaultPosition: {x: 8, y: 0},
  },
  // Right rail, bottom. Monthly average score's slot in the design.
  'average-score': {
    id: 'average-score',
    constraints: {minW: 3, maxW: 4, minH: 4, maxH: 12},
    default: {w: 4, h: CARD_H},
    small: {w: 4, h: 4},
    medium: {w: 4, h: CARD_H},
    large: {w: 4, h: CARD_H},
    defaultPosition: {x: 8, y: CARD_H * 2},
  },
  'instructor-work': {
    id: 'instructor-work',
    constraints: {minW: 5, maxW: 8, minH: 6, maxH: 12},
    default: {w: 8, h: CARD_H},
    small: {w: 4, h: 10},
    medium: {w: 8, h: CARD_H},
    large: {w: 8, h: CARD_H},
    defaultPosition: {x: 4, y: STACK_H},
  },
} as const;

/**
 * Placement order. Widgets are laid out one at a time against the space
 * already taken, so a widget can only claim its position if everything before
 * it has left room — the middle stack has to be placed top to bottom, and the
 * right rail after the column it sits beside.
 */
export const WIDGET_ORDER: WidgetId[] = [
  'course',
  'assignments',
  'learning-schedule',
  'posts',
  'average-score',
  'instructor-work',
];
