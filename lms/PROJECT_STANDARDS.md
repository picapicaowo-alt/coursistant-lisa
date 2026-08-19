# Project Standards

Living coding standards for **coursistant-lisa** (Coursistant LMS frontend).

These rules started from the LmsHomePage / CourseWorkspacePage refactor guidelines and are extended for the current LMS v2 work (assignments, quiz, roster, notifications, AI workplace, Dev 8084).

**Canonical repo:** `https://github.com/picapicaowo-alt/coursistant-lisa`  
**Related:** `ARCHITECTURE.md`, `STATE_MANAGEMENT.md`, and `API_STANDARDS.md` are historical design notes — prefer this file when they conflict with current code.

---

## 1. Stack (required)

| Layer | Choice |
|-------|--------|
| UI | React 18 functional components + hooks |
| Language | TypeScript (`.ts` / `.tsx`) |
| Build | Vite 7 |
| Server state | TanStack Query (`@tanstack/react-query`) |
| Client / page state | Zustand (+ Immer where stores already use it) |
| HTTP | Axios via `src/apis/api-client.ts` / `v2-api-client.ts` |
| Routing | `react-router-dom` |
| Styles | SCSS modules + design tokens (`src/styles/_tokens.scss`) + Tailwind utilities when needed |
| Tests | Vitest + Testing Library |
| i18n | `i18next` / `react-i18next` |

Do **not** introduce new UI kits (e.g. do not start using MUI even though it may still be in `package.json`). Prefer existing SCSS modules and tokens.

---

## 2. Component structure

### 2.1 Organization

- Prefer **container vs presentational** split for complex pages (logic in hooks/container; UI in focused components).
- One responsibility per component; split when a file owns unrelated flows.
- Page-local pieces stay under that page; shared pieces go in `src/components/`, `src/hooks/`, `src/utils/`.

### 2.2 Reference layouts

Good examples to copy:

- `src/pages/LmsHomePage/` — widgets, page hooks, types, tests
- `src/pages/CourseWorkspacePage/` — store slices, edit/view split, role-aware cards
- `src/pages/RosterPage/` — page hook + row components + SCSS module + tests
- `src/pages/AssignmentDetailPage/` — feature components colocated with tests

### 2.3 Props and composition

- Type props with TypeScript interfaces or type aliases (no PropTypes for new code).
- Prefer composition over inheritance.
- Keep optional props explicit; use `null` when “empty” is a real domain value.

---

## 3. Naming

### 3.1 Files

| Kind | Convention | Example |
|------|------------|---------|
| Components | PascalCase `.tsx` | `MemberRow.tsx` |
| Hooks | `use` + camelCase | `useRoster.ts` |
| Utils | camelCase `.ts` | `submissionState.ts` |
| Styles | `Name.module.scss` | `index.module.scss` |
| Tests | `*.test.ts(x)` next to source | `MemberRow.test.tsx` |
| API services | `*-api.ts` under `apis/services/` | `quiz-api.ts` |
| API types | domain file under `apis/types/` | `assignment.ts` |

### 3.2 Symbols

- Components / types / interfaces: PascalCase
- Functions / variables: camelCase
- Constants: UPPER_SNAKE_CASE when module-level fixed values
- CSS module keys: camelCase in TS; keep selectors readable (avoid one-letter names)

---

## 4. Folder organization

```
src/
├── apis/
│   ├── api-client.ts          # Axios client, refresh, errors
│   ├── v2-api-client.ts
│   ├── services/              # Domain API classes/functions
│   └── types/                 # Request/Response/envelope types
├── pages/
│   └── PageName/
│       ├── components/        # Page-only UI
│       ├── hooks/             # Page-only hooks
│       ├── stores/            # Page Zustand stores (when needed)
│       ├── utils/
│       ├── types.ts | types/
│       ├── index.tsx
│       └── *.module.scss
├── components/                # Shared UI
├── contexts/                  # Auth and other app-wide React context
├── hooks/
├── utils/
├── styles/                    # Tokens and globals
└── types/
```

Legacy folders (`pages/chat`, `pages/profile`, `sections/chat`, …) may still be `.jsx`. **New work must not add `.jsx` / `.js` sources.** When you touch a legacy file for behavior, prefer converting it to `.tsx` in the same change if scope allows.

---

## 5. State management

### 5.1 Choose the right layer

| Need | Use |
|------|-----|
| Server data (lists, detail, mutations) | TanStack Query + `apis/services/*` |
| Auth session | `AuthContext` / existing auth helpers |
| Complex page UI / draft / workspace mode | Zustand store colocated with the page |
| Ephemeral local UI (open/closed, input) | `useState` |

### 5.2 Rules

- Do not call Axios directly from presentational components — go through API services (and usually a hook or query).
- Invalidate or update Query caches after successful mutations that change shared lists.
- Zustand stores that are module singletons must reset or re-key when the route entity changes (see CourseWorkspacePage mode reset on `courseId`).
- Avoid duplicating the same server entity in both Query and Zustand unless there is a clear draft/edit reason.

Historical normalized-store designs in `STATE_MANAGEMENT.md` / `ARCHITECTURE.md` are optional inspiration, not mandatory for every page.

---

## 6. API conventions

### 6.1 Layout

- Contracts: `src/apis/types/*` (`Request` / `Response` naming; mirror LMS v2)
- Calls: `src/apis/services/*`
- Shared envelope: `ApiResponse` in `apis/types` — treat `code === "SUCCESS"` (string), not numeric HTTP-only success
- Writes that the backend supports: send `Idempotency-Key` via the shared helper when the endpoint requires it

### 6.2 Client behavior

- Use the shared `ApiClient` (token attach, refresh coalescing, session-expired callback).
- Prefer relative `/api` in Dev so 8084 same-origin proxy works; do not hardcode secrets or long-lived tokens into the bundle.
- Never log access tokens, refresh material, passwords, or full auth payloads.
- Binary download/preview: use authenticated blob helpers — do not put Bearer tokens in URLs.

### 6.3 Errors and empty states

- Distinguish transport failure vs domain codes (`NOT_FOUND`, empty submission, etc.).
- UI must show recoverable error + retry where the user can act; do not blank the shell.

---

## 7. TypeScript

- New files: `.ts` / `.tsx` only.
- Prefer explicit types on public function params, API payloads, and component props.
- Avoid new `any` and `as any`. If unavoidable at a boundary, narrow ASAP and comment why.
- `tsconfig` is not fully `strict` yet — **new code should still aim for strict-null-safe types** (`strictNullChecks` is on).
- Do not add `@ts-nocheck` to new files.

---

## 8. Styling

- Default: SCSS modules next to the component.
- Use design tokens via the injected `t` namespace / CSS variables — do not invent one-off brand colors.
- Tailwind is allowed for layout utilities; do not mix three competing systems in one component without reason.
- Keep interactive affordances keyboard-reachable; do not rely on color alone for state.

---

## 9. Testing

- Colocate `*.test.ts(x)` with the unit under test.
- Prefer Testing Library queries that reflect user behavior.
- Cover: API mappers/clients, role gating, critical mutations, and regression bugs you fixed.
- Run `npm run test:run` before pushing risky UI; keep `npm run build` / `build:dev` green for deployable work.
- Mock network at the API/mock-server boundary for UI tests — do not hit shared Dev DB from unit tests.

---

## 10. Security and privacy

- No credentials, PEM keys, or `.env` secrets in git.
- No shipping hardcoded API tokens or demo passwords in client code.
- Strip sensitive bodies from debug logs.
- Course-scoped capabilities beat global role checks for teaching controls when both exist.

---

## 11. Git and source of truth

- **Only** develop against `coursistant-lisa`. Do not treat `bink44/lms-frontend` or personal forks as upstream.
- Prefer small, imperative commit subjects: `feat:`, `fix:`, `test:`, `chore:`.
- Do not commit local QA screenshots (`local-*.png`, `dev-8084-*.png`) unless explicitly requested.

---

## 12. Dev 8084

- Review UI is built with `npm run build:dev` and deployed as static assets to the Dev host’s `coursistant-review-8084` release layout.
- 8084 is **not** auto-deployed from GitHub. After merge-worthy work, build from this repo and deploy deliberately.
- `/api` on 8084 proxies to the Dev LMS API (8081). Keep the frontend pointed at same-origin `/api` for review builds.

---

## 13. Known gaps (improve when you touch the area)

1. **Legacy JSX** — chat, profile, settings, old roster/notification sections still `.jsx`.
2. **Legacy type quarantine** — these files carry `// @ts-nocheck` until migration: `ChatContent.tsx`, `RichTextEditor/extensions/BlankNode.ts`, `DetailWorkspacePage/index.tsx`, `DetailWorkspacePage/components/AssignmentEdit/index.config.ts`, `stores/core/AggregateRootGenerator.test.ts`.
3. **ESLint** — now covers `*.{ts,tsx}` and `*.{js,jsx}`; run `npm run lint` before pushing.
4. **Typecheck** — run `npm run typecheck` in `lms/`; must pass on all non-quarantined files.
5. **Dead dependencies** — remove unused UI libraries once confirmed unused.
6. **Docs drift** — update this file when a new vertical establishes a better pattern than the references above.

---

## 14. PR / change checklist

- [ ] New UI is `.tsx` with typed props
- [ ] API goes through `apis/services` + typed `apis/types`
- [ ] Loading / empty / error states handled
- [ ] Role or course capability respected
- [ ] Tests added or updated for the behavior change
- [ ] No secrets in logs or bundle
- [ ] Styles use modules/tokens (no new ad-hoc global CSS dumps)
