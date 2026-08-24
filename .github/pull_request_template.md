## Outcome

<!-- What frontend behavior or maintainability problem does this change solve? -->

## Scope

- [ ] Frontend-only; no backend, AI service, database, or infrastructure change
- [ ] Existing environment and demo-account values are unchanged, or the exact requested exception is explained
- [ ] Existing React/TypeScript pattern was followed before adding a new abstraction
- [ ] No new deploy-specific URL, credential, duplicated domain constant, or ad-hoc design value
- [ ] Comments explain only non-obvious constraints and remain accurate

## Verification

- [ ] `npm run lint:ci`
- [ ] `npm run typecheck`
- [ ] `npm run typecheck:production`
- [ ] `npm run test:run`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (production-facing changes)
- [ ] Lockfile changes were reviewed and explained, or no lockfile changed

## Reviewer notes

<!-- Call out module boundaries, migration risks, or follow-up work. -->
