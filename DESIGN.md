---
name: Coursistant Student Dashboard
description: A compact course command desk with truthful LMS records and course-aware assistance.
colors:
  page-canvas: "#F1F3F8"
  surface: "#FFFFFF"
  inset-surface: "#F5F6FA"
  coursistant-indigo: "#4F46E5"
  indigo-strong: "#4338CA"
  indigo-soft: "#E7E5FD"
  ink: "#141A2B"
  muted-ink: "#5C667D"
  placeholder-ink: "#747D91"
  quiet-border: "#E4E7EE"
  course-cyan: "#22CCEE"
  course-green: "#22C55E"
  state-orange: "#F97316"
  danger-red: "#EF4444"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 2.4vw, 2.35rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  section-label:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    fontSize: "0.76rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  control-sm: "10px"
  control: "12px"
  card: "16px"
  card-lg: "18px"
  modal: "20px"
  pill: "9999px"
spacing:
  xs: "0.4rem"
  sm: "0.65rem"
  md: "1rem"
  lg: "1.1rem"
  dashboard-gutter: "24px"
  dashboard-intro-top: "12px"
  dashboard-main-group: "28px"
  dashboard-work-columns: "20px"
  dashboard-records: "8px"
components:
  surface-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "{spacing.md}"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 0.95rem"
    height: "44px"
  course-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "0.9rem"
  record-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.65rem 0.7rem"
  status-chip:
    backgroundColor: "{colors.indigo-soft}"
    textColor: "{colors.indigo-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 0.55rem"
    height: "1.75rem"
---

# Design System: Coursistant Student Dashboard

## Overview

**Creative North Star: "The Course Command Desk"**

The authenticated student dashboard is a compact operating surface for answering three questions quickly: what course am I in, what needs attention, and where can I get help? Its form follows the user-pinned reference: a framed application shell, course overview, paired work and announcement lists, and a persistent assistant rail on wide screens. Coursistant's own indigo identity and real LMS data remain authoritative; the reference supplies structure, not palette, content, or third-party branding.

The visual system is calm, dense, and operational. Section headings sit directly on the cool gray canvas while white course and record cards carry the actionable content. This proximity-led grouping avoids redundant outer panels. AI assistance remains visible but user-initiated, and every data region must preserve distinct loading, empty, and error states.

This document is scoped to the signed-in student dashboard and its dashboard-specific shell treatment. Use it when extending that surface; do not restyle unrelated LMS screens without a separate design decision.

**Key Characteristics:**

- Compact framed shell with a narrow navigation rail and a task-first content column.
- White operating surfaces over a cool gray canvas, with quiet borders and minimal shadow.
- Coursistant indigo reserved for identity, focus, links, selection, and primary action.
- Real course and state colors used sparingly for meaning, never as decorative palette copying.
- Persistent course-aware assistant rail on wide screens; normal-flow stacked assistant below the dashboard on narrower screens.

## Colors

The palette combines a cool paper-like neutral foundation with one recognizable indigo voice and a small semantic course/state set.

### Primary

- **Coursistant Indigo** (`coursistant-indigo`): Identity anchor for active navigation, links, focus, selected dates, assistant send actions, and other decisive states.
- **Pressed Indigo** (`indigo-strong`): Hover and pressed treatment for primary controls and high-emphasis indigo text.
- **Quiet Indigo Wash** (`indigo-soft`): Selected or unread backgrounds, icon wells, and low-emphasis indigo states.

### Secondary

- **Course Cyan** (`course-cyan`): Course identity or assignment meaning where the data model supplies that distinction.
- **Course Green** (`course-green`): Course identity and positive/completed status.
- **Attention Orange** (`state-orange`): Pending, manual-review, or warning states.
- **Danger Red** (`danger-red`): Destructive or closed/error meaning; never a general accent.

### Neutral

- **Cool Dashboard Canvas** (`page-canvas`): Page-level ground behind dashboard regions.
- **Operating White** (`surface`): Cards, rails, search, menus, and functional panels.
- **Inset Gray** (`inset-surface`): Hovered rows, quiet nested blocks, and disabled or subordinate areas.
- **Midnight Ink** (`ink`): Headings, values, and primary record text.
- **Slate Annotation** (`muted-ink`): Labels, timestamps, descriptions, and supporting metadata.
- **Placeholder Slate** (`placeholder-ink`): Tertiary and placeholder text at accessible body sizes.
- **Quiet Divider** (`quiet-border`): Panel, input, row, and shell boundaries.

### Named Rules

**The One Indigo Voice Rule.** Indigo communicates identity or state; it does not wash large dashboard regions or compete with course content.

**The Meaning Before Color Rule.** Cyan, green, orange, and red appear only when a course or status meaning supports them.

## Typography

**Display Font:** Plus Jakarta Sans Variable (with Inter and system UI fallbacks)
**Body Font:** Plus Jakarta Sans Variable (with Inter and system UI fallbacks)

**Character:** The single geometric sans family keeps dense records coherent. Hierarchy comes from weight, size, line height, and negative tracking in titles rather than decorative display styling or uppercase utility labels.

### Hierarchy

- **Display** (800, responsive 1.75–2.35rem, 1.08 line height): Dashboard welcome only; balance the line and keep it near 14 characters wide on desktop.
- **Title** (700, 1rem, 1.3 line height): Course names and primary record titles.
- **Section Label** (600, 0.9375rem): Muted dashboard group headings aligned directly with their first card border.
- **Body** (400, 0.875rem, 1.45 line height): Introductory guidance, search, and readable supporting copy.
- **Label** (600, 0.76rem, 1.2 line height): Links, metadata controls, chips, statuses, and compact utilities.
- **Caption** (600 or 400, approximately 0.66–0.72rem): Instructor roles, course codes, dates, timestamps, and chart labels.

### Named Rules

**The Weight Carries Hierarchy Rule.** Use the shared family across display, utility, and data roles; do not introduce a decorative display face or tracked all-caps eyebrow to manufacture hierarchy.

## Layout

The desktop shell is framed inside the viewport. A narrow icon navigation rail sits beside a top header containing search and profile controls, followed by an independently scrolling dashboard area. The dashboard uses a 24px outer gutter and a two-column grid: a flexible main column and a sticky assistant rail between 20rem and 24rem wide, separated by a 1rem rhythm. The welcome receives another 12px of top air while its title and summary remain tightly grouped. The main column then presents course overview followed by paired assignments and announcements. Calendar owns the full schedule; the summary exposes only the next class. Aggregate grades do not appear on this dashboard.

At 1040px and below, the assistant leaves the sticky rail and becomes a normal stacked region after the main content. At 760px and below, paired regions become a single column, dashboard padding tightens, and search spans the available width. At 700px and below, navigation becomes a fixed bottom bar with safe-area padding and the framed shell border/radius treatment is removed. No breakpoint may force the assistant composer or record rows below usable control widths.

**The Task Order Rule.** Narrow layouts preserve the reading and action order: orientation, search, courses, assignments, announcements, then assistant.

**The Independent Region Rule.** Loading, empty, and error states belong inside their own content region; one unavailable endpoint must not collapse or misrepresent neighboring regions.

## Elevation & Depth

Depth is restrained and mostly structural. Section wrappers remain flat on the canvas, while course and record cards use quiet borders and tonal hover changes. Stronger elevation is reserved for the assistant rail, transient overlays, and menus. Course cards may lift by 2px on hover to communicate clickability; reduced-motion users receive the same state information without movement.

### Shadow Vocabulary

- **Ambient panel** (`0 1px 2px rgba(20, 26, 43, 0.04), 0 4px 16px rgba(20, 26, 43, 0.04)`): Assistant rail and intentional elevated surfaces only.
- **Interactive course lift** (`0 10px 24px rgba(20, 26, 43, 0.08)`): Course-card hover only.
- **Transient overlay** (`0 16px 34px rgba(20, 26, 43, 0.13)`): Search results and similarly temporary layers.

### Named Rules

**The Flat-By-Default Rule.** Rows and controls are flat at rest; elevation appears only for panel hierarchy, transient overlays, or an explicit interactive response.

## Shapes

The dashboard uses gently rounded geometry rather than capsules everywhere. The assistant rail and course cards use 16px corners, compact controls and rows use 10–12px corners, and only truly compact statuses, course codes, profile treatments, and search use the full pill shape. Borders stay thin and low contrast. Avatars remain circular.

**The Honest Container Rule.** Add a card boundary only around a real functional region or navigable record; spacing alone should organize incidental wrappers.

## Components

### Search Field

- **Shape:** Full pill with a 44px minimum height and compact horizontal inset.
- **Color:** Operating white with a quiet divider border, midnight text, and muted placeholder/icon.
- **Focus:** Border shifts toward indigo and gains a low-opacity three-pixel focus halo.
- **Results:** Anchored overlay with 16px corners, grouped course and assignment results, and keyboard-visible states.

### Course Cards

- **Shape:** Functional record card with 16px corners, thin border, and compact 0.9rem inset.
- **Identity:** Course code appears as a small tinted pill; the accent rotates only across the established course tones.
- **Content:** One-line course title, instructor identity, role chip, and direct destination indicator.
- **Hover / Focus:** Accent-aware border, restrained lift, arrow nudge, and visible focus outline; disable transforms under reduced motion.

### Assignment and Announcement Rows

- **Shape:** Compact three-column row with a 12px radius, 44px-or-larger interactive targets, and a small indigo icon well.
- **Content:** Primary title truncates safely, supporting course/time metadata stays visible, and status/unread information occupies the final column.
- **Responsive:** On very narrow screens, status moves beneath the copy instead of squeezing the title.
- **States:** Border/tonal hover, visible focus, and inline loading, empty, error, and retry states.

### Status Chips

- **Style:** Small pill with semibold caption text and a semantic tint.
- **State:** Indigo for unread/selection, green for complete, orange for warning, and red for closed/error. Status must also be expressed in text.

### Dashboard Content Groups

- **Container:** No outer card, border, background, or shadow around Courses, Assignments, or Announcements.
- **Grouping:** Section heading and action sit directly above their related card or row list using proximity.
- **Hierarchy:** Group headings use muted ink, 15px semibold type, and a shared 10px content gap so they guide scanning without competing with records.
- **Records:** Each actionable course, assignment, or announcement remains a white bordered card on the cool canvas.
- **Rhythm:** Use generous separation between groups and tight spacing inside each group.

### Assistant Rail and Composer

- **Role:** A persistent, real course-aware assistant on wide screens; it is not a decorative teaser.
- **Container:** White 16px rail with clipped overflow and the same ambient elevation as dashboard panels.
- **Header:** A compact branded mark starts 16px from the rail edge, followed by an 8px gap and the title stack, preventing the heading from clinging to the divider.
- **Composer:** Bordered 16px field group with course selection, attachment, multiline input, explicit send control, and visible disabled/locked states.
- **Behavior:** AI generation begins only after an explicit user action. The rail becomes a normal-height stacked region before its controls can clip.

### Dashboard Navigation

- **Desktop:** Narrow vertical icon rail; the active destination uses a compact indigo tile with white content.
- **Mobile:** Fixed bottom navigation with safe-area padding, equal-width destinations, and no decorative active shadow.
- **Focus:** Every destination retains a visible outline independent of active color.

## Do's and Don'ts

### Do:

- **Do** preserve the pinned form: compact shell, course overview, paired work/announcement regions, and a persistent wide-screen assistant rail.
- **Do** use the dashboard token source for colors, type, radii, and shadows rather than introducing feature-local visual constants.
- **Do** keep 44px minimum control targets and visible `:focus-visible` feedback for search, navigation, row links, retry actions, and assistant controls.
- **Do** distinguish loading, empty, unavailable, and transport-error states inside each data region.
- **Do** preserve direct links to the exact course object whenever the contract exposes one.

### Don't:

- **Don't** copy the reference palette, third-party branding, or fabricated course records; its authority is form only.
- **Don't** turn semantic course/status colors into decorative accents or full-panel washes.
- **Don't** make AI generate on page load, hide its course context, or let the rail compress below usable composer dimensions.
- **Don't** wrap every row or wrapper in another elevated card; use spacing, border, and tonal layering first.
- **Don't** communicate selected, unread, warning, complete, or error states by color alone.
