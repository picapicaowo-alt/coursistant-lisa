import {WidgetId, WidgetLayoutConfig} from "@/pages/LmsHomePage/types";

export const SCREEN_BREAKPOINTS = {
  SMALL: 540,
  MEDIUM: 720,
  LARGE: 960,
} as const;

/**
 * Grid geometry, measured off docs/design/02-dashboard-instructor.png.
 *
 * At full width the canvas is three columns in a 4 : 5 : 3 ratio — the chat
 * rail, the course stack, and a narrow right rail. Measured against a 1755px
 * content area those come out at 548 / 770 / 370 px.
 *
 *   x:  0        4              9        12
 *       ┌────────┬──────────────┬────────┐
 *       │        │ My Course    │        │  y 0
 *       │        ├──────────────┤ Learn- │
 *       │  AI    │ Course list  │ ing    │  y 9
 *       │  chat  ├──────────────┤ Sched. │
 *       │        │ Announce-    │        │  y 18
 *       │        │ ments        ├────────┤
 *       └────────┴──────────────┴────────┘  y 27
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
  // Left rail, full height of the middle stack.
  chat: {
    id: 'chat',
    constraints: {minW: 4, maxW: 4, minH: 12, maxH: STACK_H},
    default: {w: 4, h: STACK_H},
    small: {w: 4, h: 12},
    medium: {w: 4, h: STACK_H},
    large: {w: 4, h: STACK_H},
    defaultPosition: {x: 0, y: 0},
  },
  // Middle stack, top.
  course: {
    id: 'course',
    constraints: {minW: 4, maxW: 5, minH: 6, maxH: 12},
    default: {w: 5, h: CARD_H},
    small: {w: 4, h: 8},
    medium: {w: 4, h: CARD_H},
    large: {w: 5, h: CARD_H},
    defaultPosition: {x: 4, y: 0},
  },
  // Middle stack, centre. The per-course list.
  assignments: {
    id: 'assignments',
    constraints: {minW: 4, maxW: 5, minH: 5, maxH: 12},
    default: {w: 5, h: CARD_H},
    small: {w: 4, h: 5},
    medium: {w: 4, h: CARD_H},
    large: {w: 5, h: CARD_H},
    defaultPosition: {x: 4, y: CARD_H},
  },
  // Middle stack, bottom. Group Chat's slot in the design.
  posts: {
    id: 'posts',
    constraints: {minW: 4, maxW: 5, minH: 4, maxH: 12},
    default: {w: 5, h: CARD_H},
    small: {w: 4, h: 5},
    medium: {w: 4, h: CARD_H},
    large: {w: 5, h: CARD_H},
    defaultPosition: {x: 4, y: CARD_H * 2},
  },
  // Right rail, top. Two cards tall — the calendar plus the day's items.
  'learning-schedule': {
    id: 'learning-schedule',
    constraints: {minW: 3, maxW: 4, minH: 8, maxH: CARD_H * 2},
    default: {w: 3, h: CARD_H * 2},
    small: {w: 3, h: 8},
    medium: {w: 4, h: CARD_H * 2},
    large: {w: 3, h: CARD_H * 2},
    defaultPosition: {x: 9, y: 0},
  },
  // Right rail, bottom. Monthly average score's slot in the design.
  'average-score': {
    id: 'average-score',
    constraints: {minW: 3, maxW: 4, minH: 4, maxH: 12},
    default: {w: 3, h: CARD_H},
    small: {w: 4, h: 4},
    medium: {w: 4, h: CARD_H},
    large: {w: 3, h: CARD_H},
    defaultPosition: {x: 9, y: CARD_H * 2},
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
  'chat',
  'course',
  'assignments',
  'learning-schedule',
  'posts',
  'average-score',
  'instructor-work',
];
