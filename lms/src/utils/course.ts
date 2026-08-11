/**
 * Renders a course the way every screen shows it: `[CS01]Computer Science`.
 *
 * The code is part of the displayed name rather than a separate line — the
 * design spec describes a "8 WEEKS · 95 SKILLS" subtitle under the title on
 * dashboard cards, but no such line exists in the screenshots and no endpoint
 * supplies those numbers. Card titles use this and nothing else.
 */
export const formatCourseName = (courseCode: string | null | undefined, title: string): string =>
  courseCode ? `[${courseCode}]${title}` : title;
