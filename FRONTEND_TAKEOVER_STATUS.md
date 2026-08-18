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
- Kept the global Dashboard/sidebar/header shell visible on nested course, assignment, quiz, and notification routes.
- Replaced course `navigate(-1)` history loops with a deterministic Back to Dashboard action.
- Normalized public backend avatar URLs to the configured API origin, including the dev `:8081` port, while leaving external avatar hosts unchanged.

### Assignment vertical slice

- Added typed LMS v2 assignment contracts and API methods.
- Added role-shaped assignment detail for students and staff.
- Added student staging-file upload, removal, confirmation, and idempotent submission.
- Treat the live API's `404 NOT_FOUND / No formal submission yet` response as a valid empty submission state, while preserving retry UI for real request failures.
- Added instructor assignment creation, editing, attachment upload, and publishing.
- Added a recoverable assignment checkpoint: once the assignment record is created, attachment or publish retries reuse the same assignment ID and do not re-upload attachments that already succeeded.
- Added instructor grading roster, search/filter, score and feedback entry, and grade release.
- Added course-detail entry points for assignment creation, editing, and grading.
- Added safe feedback escaping before HTML is sent to the grading API.

### Notifications

- Added the authenticated notification inbox and unread-count APIs.
- Added a header notification bell with polling, unread badge, paged inbox, and loading/error/empty states.
- Added idempotent single-read and mark-all-read operations.
- Disabled navigation for `NO_LONGER_AVAILABLE` notifications.
- Added safe same-origin deep-link resolution for assignment, quiz, announcement, event, week, and group-set destinations.
- Added read-only announcement, event, week, and group-set notification destination pages with retry and unavailable states.
- Kept a safe owning-course fallback for unimplemented nested subjects such as a specific assignment submission.

### Quiz vertical slice

- Added typed API coverage for quiz settings, question CRUD/reorder, publish/unpublish, attempts, autosave, submit/receipt, results, manual grading, and grade release/retract.
- Added quiz listings and authoring entry points to the course workspace.
- Added instructor quiz creation and settings, all four question types, answer-key inputs, question ordering/deletion, and publishing.
- Added student attempt start, per-question save, final confirmation/submit, receipt, pending-manual-grade, and released-result views.
- Added short-answer grading, objective/manual completion summaries, and release/retract controls.

### Course and S3 material experience

- Fixed a Zustand/render-effect loop that crashed real course pages with `Maximum update depth exceeded`.
- Added stable query fallbacks so pending course-week data does not trigger repeated store writes.
- Added authenticated binary download and preview methods for course materials.
- Added Preview and Download actions to file materials, without exposing the Bearer token in a URL.
- Kept object storage opaque to the frontend; no MinIO or S3 host is hardcoded.
- Added Instructor week management: create, inline rename, full-permutation reorder, confirmed delete, publish, and unpublish.
- Added material management: multi-file upload, external links, inline rename, within-week reorder, cross-week move, and confirmed delete.
- Added an upload-first S3 verification fixture and mock behavior: newly uploaded files support preview/download/delete, while old pre-migration objects deliberately return 404.
- Reuse idempotency keys across automatic retries for week creation and file/link material creation.
- Added PRD-aligned TA content controls: a content-enabled TA can upload and delete only their own materials, while course/week structure stays Instructor-only.

### Course-scoped access control

- Added a shared `/v2/me/courses` membership query and a fail-closed course-capability model.
- Replaced privileged global `user.level` checks in the current course, assignment, and grading flows with per-course `INSTRUCTOR`, `TA`, and `STUDENT` access.
- Limited assignment authoring and grade release to the course Instructor.
- Allowed TAs to grade only when `canGrade` is granted and kept TA material-upload access separate from their global account level.
- Prevented stale edit modes from rendering privileged course controls after access changes.
- Aligned the frontend capability model with the PRD's fifth TA toggle, `canManageContent`; it fails closed until the backend returns that field.

### Static design assets

- Restored all 320 PNG assets that had remained as Git LFS pointer text in the checkout.
- Verified the restored objects against their repository SHA-256 identifiers, including the login artwork, application logo, navigation icons, instructor avatars, and dashboard imagery.
- Store this 4.5 MiB asset set directly in Git so backup clones and deployment checkouts do not depend on a separately installed Git LFS client.

### Dashboard navigation and language rollout

- Made calendar dates real keyboard-accessible buttons with clear selected state.
- Made every Learning Schedule activity a whole-card link to the exact `courseId` supplied by the activity API, with hover, focus, and direction affordances.
- Made assignment titles and Submit/Resubmit actions open the exact assignment or quiz instead of dropping users at the course root.
- Made recent-announcement cards open the exact announcement destination.
- Replaced click-only dashboard `div`/`a` controls with semantic links so keyboard, screen-reader, open-in-new-tab, and browser-history behavior work normally.
- Temporarily removed language selectors from authentication, dashboard, and course headers and forced English startup while the Chinese translation remains incomplete. Chinese resource files remain available for the future full rollout.

### Verification and development support

- Added a local mock LMS server for safe UI testing without dev-database writes.
- Expanded the mock server into an interactive week/material preview so every management action can be reviewed even when 8081 is unavailable.
- Added service, authentication, upload, routing, deep-link, and store-loop regression tests.
- Current result: 124 tests passed across 25 test files.
- Current production Vite build succeeds.
- Files changed by the takeover have no TypeScript errors.
- Live 8081 notification unread-count and inbox GET flows were verified successfully.
- Live course 31 renders successfully after the store-loop fix.

## Known backend or environment blockers

- The dev host is reachable again as of the latest 2026-08-17 check (Swagger returned HTTP 200 and an unauthenticated v2 request returned the expected 401). Local write previews still use the in-memory API so they do not mutate shared dev data.
- Live `GET /v2/courses/31/weeks/11/materials/19/preview` returns HTTP 503. The authenticated frontend request reaches the correct endpoint; backend S3/preview configuration needs inspection.
- Live notifications `19` and `20` for user `385` contain question marks in the API response. Their source announcement titles are valid Chinese, while both source bodies also contain question marks. Exact IDs, source lookups, and database inspection SQL are documented in `BACKEND_HANDOFF_NOTIFICATION_TA.md`.
- Production token refresh still depends on the final frontend/API domain and refresh-cookie settings being compatible. The development proxy avoids the current cross-origin cookie and duplicate-CORS-header issues.
- The documented assignment-create API does not yet accept an `Idempotency-Key`. The frontend now prevents duplicate retries after it receives the created assignment ID, but an ambiguous network timeout after a server-side create still needs backend idempotency for complete protection.
- PRD defines five TA toggles, but the current backend and live Swagger expose only four. `canManageContent` is missing, current material authorization allows any Active TA, and teaching-dashboard endpoints still require global `INSTRUCTOR` level.

## Remaining frontend work

### P0 — integration completion

- Run controlled write E2E against 8081 for assignment creation/publishing, student submission, grade entry/release, notification read, and S3 download after backend approval.
- Re-test S3 preview/download/delete with a newly uploaded real file after the HTTP 503 is resolved; do not use old MinIO-era rows as the primary signal.
- Verify the remaining legacy screens before removing their fallback global-role state; current privileged course, assignment, and grading controls are course-scoped.
- Add client support for an assignment-create `Idempotency-Key` if/when the backend contract exposes it.

### P1 — missing product flows

- Extend the quiz vertical slice with existing-question editing, per-student attempt history/retakes, selected-user grade release, and broader edge-case UX.
- Add a dedicated assignment-submission notification destination; other current notification subject routes are implemented.
- Add rubric grading, annotated-file workflow, selected-grade release/retract, and existing-feedback retrieval.
- Replace the old static Notification Settings screen when a notification-preferences API contract is available.
- Finish course event and group management flows against the new APIs.

### P2 — stabilization and delivery

- Resolve legacy TypeScript debt in `ChatContent`, the old rich-text editor, sidebar typing, old detail-workspace models, and aggregate-store tests.
- Remove or migrate obsolete v1 assignment/detail workspace code after feature parity is confirmed.
- Complete Chinese translations for the full product, then re-enable the language selector as one coherent rollout.
- Complete mobile, keyboard, screen-reader, and cross-browser QA.
- Add CI checks for tests, build, TypeScript, and contract drift.
- Define deployment, environment-variable, rollback, monitoring, and frontend error-reporting procedures.

## Recommended next sequence

1. Complete controlled assignment, notification-write, week/material, S3, and quiz E2E testing when the dev backend is ready.
2. Add existing-question editing, attempt history/retakes, and selected-user quiz grade release.
3. Add the assignment-submission notification destination and finish course event/group management.
4. Remove legacy code and close the repository-wide TypeScript/CI backlog.

## Safety notes

- No SSH key or database credential is required by the frontend.
- No credential is committed in this repository.
- Real-environment verification performed during the takeover was read-only; notification PATCH operations were exercised only against the local in-memory mock.
