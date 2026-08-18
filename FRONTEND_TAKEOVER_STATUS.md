# Coursistant Frontend Takeover Status

Updated: 2026-08-17

This repository is a continuation of the existing React + TypeScript LMS frontend. The takeover work preserves the original application and incrementally replaces incomplete or legacy flows with the current LMS v2 contracts on backend port 8081.

## Completed in the takeover

### Application and authentication baseline

- Restored missing TipTap dependencies so production builds succeed.
- Corrected multipart requests so the browser supplies valid upload boundaries.
- Added transparent access-token refresh with concurrent refresh coalescing.
- Added server logout before local-session cleanup.
- Removed sensitive request/response bodies from development logs.
- Fixed the protected-route refresh race that redirected valid sessions to `/login`.
- Added page-level error boundaries so one failed route does not blank the entire shell.

### Assignment vertical slice

- Added typed LMS v2 assignment contracts and API methods.
- Added role-shaped assignment detail for students and staff.
- Added student staging-file upload, removal, confirmation, and idempotent submission.
- Added instructor assignment creation, editing, attachment upload, and publishing.
- Added instructor grading roster, search/filter, score and feedback entry, and grade release.
- Added course-detail entry points for assignment creation, editing, and grading.
- Added safe feedback escaping before HTML is sent to the grading API.

### Notifications

- Added the authenticated notification inbox and unread-count APIs.
- Added a header notification bell with polling, unread badge, paged inbox, and loading/error/empty states.
- Added idempotent single-read and mark-all-read operations.
- Disabled navigation for `NO_LONGER_AVAILABLE` notifications.
- Added safe same-origin deep-link resolution and mapped backend `/courses/...` assignment links to existing frontend `/course/...` routes.
- Added fallbacks to the owning course for subject routes the frontend does not yet implement.

### Course and S3 material experience

- Fixed a Zustand/render-effect loop that crashed real course pages with `Maximum update depth exceeded`.
- Added stable query fallbacks so pending course-week data does not trigger repeated store writes.
- Added authenticated binary download and preview methods for course materials.
- Added Preview and Download actions to file materials, without exposing the Bearer token in a URL.
- Kept object storage opaque to the frontend; no MinIO or S3 host is hardcoded.

### Verification and development support

- Added a local mock LMS server for safe UI testing without dev-database writes.
- Added service, authentication, upload, routing, deep-link, and store-loop regression tests.
- Current result: 86 tests passed across 13 test files.
- Current production Vite build succeeds.
- Files changed by the takeover have no TypeScript errors.
- Live 8081 notification unread-count and inbox GET flows were verified successfully.
- Live course 31 renders successfully after the store-loop fix.

## Known backend or environment blockers

- Live `GET /v2/courses/31/weeks/11/materials/19/preview` returns HTTP 503. The authenticated frontend request reaches the correct endpoint; backend S3/preview configuration needs inspection.
- Two existing live notification messages contain literal `??` characters while other Chinese text on the same page renders correctly. This points to notification-generation or historical-data encoding rather than frontend font/encoding.
- Production token refresh still depends on the final frontend/API domain and refresh-cookie settings being compatible. The development proxy avoids the current cross-origin cookie and duplicate-CORS-header issues.

## Remaining frontend work

### P0 — integration completion

- Run controlled write E2E against 8081 for assignment creation/publishing, student submission, grade entry/release, notification read, and S3 download after backend approval.
- Re-test S3 preview/download after the HTTP 503 is resolved.
- Replace global `user.level` checks with per-course capabilities so TA and delegated course roles receive the correct create/edit/grade permissions.
- Add recoverable handling for partial assignment creation (for example, assignment created but attachment upload failed) to prevent duplicate retries.

### P1 — missing product flows

- Implement full quiz authoring, attempts, grading, and grade-release frontend flows.
- Implement course-week/material management: create, rename, reorder, move, upload, delete, publish, and unpublish.
- Add frontend routes for announcement, quiz, week, event, group-set, and submission notification deep links. They currently fall back safely to the course.
- Add rubric grading, annotated-file workflow, selected-grade release/retract, and existing-feedback retrieval.
- Replace the old static Notification Settings screen when a notification-preferences API contract is available.
- Finish course event and group management flows against the new APIs.

### P2 — stabilization and delivery

- Resolve legacy TypeScript debt in `ChatContent`, the old rich-text editor, sidebar typing, old detail-workspace models, and aggregate-store tests.
- Remove or migrate obsolete v1 assignment/detail workspace code after feature parity is confirmed.
- Add Chinese translations for the new assignment, grading, notification, and material controls.
- Complete mobile, keyboard, screen-reader, and cross-browser QA.
- Fix legacy broken/missing image assets visible on some dashboard and AI-chat screens.
- Add CI checks for tests, build, TypeScript, and contract drift.
- Define deployment, environment-variable, rollback, monitoring, and frontend error-reporting procedures.

## Recommended next sequence

1. Backend resolves the live S3 preview 503 and confirms production cookie/CORS topology.
2. Frontend completes controlled assignment, notification-write, and S3 E2E testing.
3. Implement per-course Instructor/TA permissions.
4. Complete week/material CRUD and notification deep-link destinations.
5. Build the quiz vertical slice.
6. Remove legacy code and close the repository-wide TypeScript/CI backlog.

## Safety notes

- No SSH key or database credential is required by the frontend.
- No credential is committed in this repository.
- Real-environment verification performed during the takeover was read-only; notification PATCH operations were exercised only against the local in-memory mock.
