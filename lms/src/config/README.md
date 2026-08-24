# Frontend Configuration Boundary

`env.ts` is the typed read boundary for frontend configuration. Feature modules
should consume its exported model instead of repeating environment lookups or
deploy-specific literals.

This directory does not own backend, AI service, database, proxy, or demo-account
configuration. Existing environment keys and values are integration inputs:
do not rename or change them unless that exact frontend configuration change is
explicitly requested.
