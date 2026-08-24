# LMS Frontend (coursistant-lisa)

Coursistant LMS front end — React 18 + TypeScript + Vite.

## Docs

| Doc | Use |
|-----|-----|
| [../AGENTS.md](../AGENTS.md) | Coursistant core frontend rules and ownership boundary |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Setup, contribution workflow, comments, and lockfiles |
| [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md) | **Start here** — coding standards for new work |
| [src/README.md](./src/README.md) | Live module map and feature placement |
| [FRONTEND_TAKEOVER_STATUS.md](../FRONTEND_TAKEOVER_STATUS.md) | Product/takeover progress |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Historical architecture notes |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) | Historical Zustand framework notes |
| [API_STANDARDS.md](./API_STANDARDS.md) | Historical API design notes |

## Quick start

```bash
cd lms
npm ci
npm run dev
```

Useful scripts: `npm run test:run`, `npm run build`, `npm run build:dev` (8084 review build).

For production, deploy the output of a clean `main` checkout after `npm ci` and
`npm run build`. Environment and demo-account values are existing integration
inputs and are not rewritten as part of normal frontend feature work.

## Source of truth

GitHub: https://github.com/picapicaowo-alt/coursistant-lisa
