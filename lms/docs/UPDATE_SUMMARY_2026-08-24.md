# Update summary — 2026-08-24

Canonical frontend: `picapicaowo-alt/coursistant-lisa`.

## Source consolidation

- All remote feature branches are ancestors of
  `codex/frontend-production-sync`; there is no unmerged feature branch to
  recover.
- The current branch contains `df71d8a` on top of `main` at `c342c6b`.
- The separate `lms-frontend-progress` workspace copy is an older snapshot and
  is not a source of truth.

## Product updates included in the current line

- P1/P2 backend integration for course, assignment, quiz, roster, notification,
  calendar, admin, file, and grading workflows.
- Course-scoped authorization and clearer forbidden/hidden-course states.
- Student course grades, notification deep links, refresh after quiz regrading,
  and normalized dashboard announcement time.
- Safer instructor grading and rubric empty-state handling.
- AI Workplace streaming, thinking progress, dynamic integrations, and session
  preservation when an auxiliary agent rejects authentication.
- Inline Markdown and LaTeX authoring, quiz-attempt review in a modal, and
  reliable removal of inline text formatting.
- X-Learn login branding and removal of unfinished product copy.

`FRONTEND_TAKEOVER_STATUS.md` remains the detailed feature-level history.

## Release engineering updates in this audit

- Dev and Prod browser configuration is now same-origin and environment-neutral.
- Local proxy targets moved to untracked `LMS_*` values.
- Builds now emit a source- and file-hashed `release.json`.
- CI can be manually dispatched and uploads the verified immutable artifact.
- Source audit freezes legacy JavaScript, `@ts-nocheck`, direct HTTP, public env
  access, environment hosts, and secret-like demo material.
- OpenAPI contract locking and cross-environment deployment verification are
  executable npm commands rather than checklist-only guidance.
