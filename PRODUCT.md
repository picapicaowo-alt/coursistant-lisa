# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Coursistant serves authenticated students, instructors, teaching assistants, and tenant administrators. The student dashboard is the visual baseline for the signed-in product; all role-specific pages extend its compact shell and operating-surface language.

## Product Purpose

Coursistant brings course access, upcoming work, announcements, schedules, grades, and course-aware study support into one LMS. A successful dashboard lets a student understand what needs attention, move to the exact course object, and ask for help without reconstructing course context.

## Positioning

The product combines ordinary LMS records with a dedicated course-aware AI chatbot. Students can ask it directly from the dashboard or continue in the full AI Assistant workspace; it never generates content on page load without an explicit user action.

## Operating Context

Students use the web application throughout a teaching term to scan active courses, upcoming assignment deadlines, recent announcements, scheduled sessions, and released grades. Dashboard regions load independently so one failed endpoint does not blank or misrepresent the rest of the page.

## Capabilities and Constraints

- The frontend is React 18, TypeScript, Vite, TanStack Query, React Router, and SCSS Modules with shared design tokens.
- Course, assignment, announcement, schedule, grade, and assistant behavior must remain backed by existing frontend services and typed contracts.
- Loading, empty, and transport-error states must remain distinct for every data region.
- Student and teaching roles have different endpoint permissions; the student dashboard must not call teaching-only endpoints.
- No dashboard field may be fabricated when the API does not provide it.
- Environment values, backend services, infrastructure, and AI-service implementations are outside this frontend redesign.

## Brand Commitments

- The product name is Coursistant.
- The existing Coursistant logo and indigo brand family remain recognizable assets.
- This task binds the authenticated product shell to the supplied dashboard reference: compact navigation, restrained header, cool canvas, white operating surfaces, and consistent responsive behavior. The dashboard keeps its course overview, paired work and announcement lists, and persistent right-side assistant rail on wide screens.

## Evidence on Hand

- Existing product behavior and API contracts live under `lms/src/`.
- Existing brand and navigation assets live under `lms/public/icons/`.
- The user supplied a dashboard layout reference in this task. It is structural inspiration, not a source of product data or third-party branding.
- No permission was given to invent customer claims, performance metrics, or course records.

## Product Principles

- Show the next useful action without hiding the course context behind it.
- Keep AI assistance user-initiated and grounded in existing course workflows.
- Preserve truth in partial states: unavailable data is an error or unknown state, never a false empty state.
- Keep each dashboard region independently recoverable.
- Prefer direct object links over dropping users at a generic course root.

## Accessibility & Inclusion

Dashboard controls must remain keyboard reachable, retain visible focus, expose meaningful labels and status text, respect reduced-motion preferences, and adapt from wide desktop layouts to mobile web without horizontal page overflow.
