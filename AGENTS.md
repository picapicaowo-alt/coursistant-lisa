# Coursistant Core Frontend Rules

These rules apply to the entire repository and to humans, coding agents, and
automation working in it.

## Rule 1: this repository owns the frontend only

- This repository owns the browser application: React components, TypeScript
  types, frontend state, styling, accessibility, frontend tests, and frontend
  build configuration.
- Do not inspect, edit, deploy, migrate, or claim ownership of backend services,
  AI service implementations, databases, infrastructure, or their source
  repositories from a frontend task.
- Do not change tracked environment values, proxy targets, or designated demo
  account values unless the task explicitly names that frontend value as its
  scope. They are integration inputs, not opportunistic cleanup targets.
- When a frontend change exposes an external contract problem, record the
  expected/observed behavior for handoff. Do not repair the external system.

## Source of truth

- Canonical repository: `picapicaowo-alt/coursistant-lisa`.
- `main` must remain understandable, tested, and directly buildable as the
  production frontend source.
- Follow `lms/PROJECT_STANDARDS.md`. Historical documents never override the
  live code and that standard.

## Implementation rules

- Follow the existing React 18 + TypeScript + Vite architecture before adding a
  new abstraction or dependency.
- New production modules are `.ts`/`.tsx`. Keep page-only code with its page;
  promote code to shared folders only after it has a real shared consumer.
- Components render UI. Hooks coordinate behavior. API services own browser
  requests. TanStack Query owns server state; Zustand owns complex client/page
  state; `useState` owns local transient state.
- SCSS Modules and the existing design tokens are the default styling path.
  MUI or another UI kit is not permanently prohibited, but adding one requires
  an explicit frontend architecture decision covering token/theme mapping,
  shared component ownership, accessibility, bundle cost, and migration scope.
  Approved kit components must enter through the shared UI layer rather than
  ad-hoc imports in feature pages.
- Do not add deploy-specific URLs, credentials, demo values, duplicated route
  strings, role/status strings, or design colors directly in feature code. Use
  the existing environment key, config module, typed domain constant, route
  helper, or design token that owns the value. Do not move or rename existing
  integration values as drive-by cleanup.
- Comments explain constraints, invariants, compatibility decisions, and the
  reason behind non-obvious code. Do not narrate syntax or leave stale history
  in source comments. Add concise TSDoc/JSDoc at tricky API, permission,
  lifecycle, concurrency, cache, and state-transition boundaries; there is no
  comment quota, and self-evident code should remain self-evident.
- Never add `any`, `as any`, `@ts-nocheck`, ignored lint errors, secrets, or
  production `console.log` calls to avoid doing the real work.

## Required checks

From `lms/`, run the checks proportionate to the change. Before merging a
production-facing change, the complete baseline is:

```bash
npm run lint:ci
npm run typecheck
npm run typecheck:production
npm run test:run
npm run build
npm run test:e2e
```

Do not merge with a failing check or unexplained lockfile change.
