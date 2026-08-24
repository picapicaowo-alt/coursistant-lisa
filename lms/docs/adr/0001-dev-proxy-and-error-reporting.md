# ADR 0001: Dev proxy, stylesheet BOM, and error reporting

Status: accepted
Date: 2026-08-19

## Dev same-origin proxy

The Vite dev server proxies `/api`, `/ai-agent`, and `/study-support` when the
corresponding `LMS_*_PROXY_TARGET` values are present in an untracked
`.env.local` file.

- The refresh token is an HttpOnly cookie with `SameSite=Lax`. A cross-origin XHR would not send it.
- The backend currently emits `Access-Control-Allow-Origin` twice on some responses. Browsers reject a duplicated value. The proxy keeps the browser same-origin until that server bug is fixed.
- The AI Agent proxy strips the browser `Origin` header for the same duplicated-CORS reason.

Deployed builds always use the same relative paths. Nginx owns every upstream
host in Dev and Prod, so an environment hostname never enters the browser
bundle. This also allows both environments to receive the same immutable
artifact.

## Stylesheet BOM

Several legacy SCSS files still carry a UTF-8 BOM. Sass accepts a BOM only at the very start of a file. Vite `additionalData` prepends `@use tokens`, which would leave the BOM in the middle and fail the compile. The preprocessor strips a leading BOM before prepending.

## Error boundary history

`ErrorBoundary` exists because `useSuspenseQuery` reports failure by throwing. Without a boundary, a failed load unmounted the whole app (PRIN-02). Keep the boundary as last-resort UI; feature regions still handle their own errors. Production reporting goes through `frontendErrorReporter` with PII redaction, not raw `console.error` of the error object.
