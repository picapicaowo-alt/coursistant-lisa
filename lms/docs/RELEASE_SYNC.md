# Release and environment synchronization

This is the release contract for the Coursistant frontend. Dev and Prod are
considered synchronized only when they serve the same full Git SHA and the same
`artifactSha256` from `release.json`.

## Invariants

1. Build once from a clean, reviewed commit. Never rebuild separately on the
   Dev and Prod hosts.
2. Browser service locations are relative: `/api`, `/ai-agent`, and
   `/study-support`. Environment hosts, ports, certificates, and credentials
   belong to Nginx or the deployment platform.
3. Every build emits `dist/release.json` with the source repository, full Git
   SHA, dirty-worktree flag, file inventory, per-file SHA-256, and aggregate
   artifact SHA-256.
4. A dirty build may be tested locally but must never be deployed.
5. A frontend release is not promotable until the target backend OpenAPI and
   database migration attestation are recorded.

## Local development

Copy `.env.local.example` to `.env.local` and supply local proxy targets. The
`LMS_*` variables are server-only Vite settings and are never bundled. Do not
put secrets in any `VITE_*` variable because Vite exposes those values to the
browser.

```bash
npm ci
npm run audit:source
npm run lint:ci
npm run typecheck
npm run typecheck:production
npm run test:run
npm run build:release
```

## Promotion procedure

1. Merge the reviewed change to `main` after CI is green.
2. Download the CI artifact named for the full commit SHA. Do not run another
   build on a deployment host.
3. Verify `release.json`, then extract that exact archive into a new immutable
   release directory in Dev.
4. Switch the Dev `current` pointer atomically and run smoke tests against the
   target API without production data writes.
5. Promote the same archive to Prod and switch its `current` pointer.
6. Verify both targets from a trusted workstation:

```bash
npm run deploy:verify -- <dev-base-url> <prod-base-url>
```

The command downloads every file listed in `release.json`, verifies its hash,
checks the HTML entry assets, rejects dirty builds, and requires both targets
to report the same Git SHA and artifact digest.

## Backend and database gate

The frontend never owns database tables or migrations. Its integration boundary
is the backend OpenAPI contract. Before promotion, the backend owner must supply:

- the exact backend Git SHA deployed to Dev and Prod;
- an OpenAPI document matching `contracts/backend-contract.json`;
- the migration tool and applied migration version for each database;
- a completed backup/restore check and rollback owner.

Verify a supplied OpenAPI URL or local JSON file with:

```bash
npm run audit:contract -- <openapi-url-or-file>
```

If the contract intentionally changes, review the frontend impact first and
update the lock in the same pull request. A matching OpenAPI fingerprint does
not prove the database is migrated; database attestation remains a separate
release gate.

## Rollback

Keep at least the previous verified release. Rollback switches `current` to
that release atomically, reloads the static server if required, and reruns the
deployment verifier. Do not reconstruct an old build from a branch or package
cache.
