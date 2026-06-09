# NASWebTS Agent Guide

## Project Context

NASWebTS is a remote-machine Web NAS for convenient file upload, download, browsing, trash/restore, logs, and future feature extensions. Treat it as a private administration surface that can expose sensitive files from a Mac mini or another remote host.

## Required Skills

- Use `react-next-engineering` for all `frontend/` work: Next.js App Router, React 19, MUI, TanStack Query, accessibility, hydration, and browser verification.
- Use `nestjs-backend` for all `backend/` work: NestJS modules, controllers, providers, guards, interceptors, config, tests, and production hardening.
- Use Codex Security skills for any change touching path handling, upload/download, auth, roles, logs, env/config mutation, CORS, Docker exposure, or filesystem deletion.
- Use the Browser plugin after meaningful UI changes when a dev server is available.

## Engineering Rules

- Security first: every filesystem path must be normalized, resolved, and verified to remain inside the configured root. Prefer `path.relative(root, target)` checks over naive string prefix checks.
- Never trust client-provided paths, file names, roles, user IDs, or log paths. Validate DTOs at Nest controller boundaries and authorize in backend guards/services.
- Keep controllers thin. Put filesystem, auth, config, logging, and audit behavior in injectable services.
- Preserve OS independence. Use Node `path` APIs and avoid hardcoded Windows or POSIX separators in logic.
- Keep large-file workflows streaming-first. Avoid buffering uploads/downloads in memory unless an explicit file-size limit and rationale exist.
- Do not expose tokens in URLs. Prefer secure cookie/session flows for OAuth callbacks and downloads.
- Keep frontend state URL-aware for navigable file locations, tabs, filters, and selected views where useful.
- Use stable TanStack Query keys and invalidate precisely after mutations.
- Avoid broad `any`, `console.log` debugging, disabled eslint comments, and browser APIs during server render.
- Prefer direct MUI/icon imports already used by the repo. If bundle size becomes a concern, configure Next `optimizePackageImports`.

## Verification Expectations

- After code changes, actively fix new errors and warnings instead of only documenting them.
- Run the narrowest meaningful checks first:
  - `cd frontend && npm run lint`
  - `cd backend && npm test -- --runInBand`
  - `cd backend && npm run build` when backend contracts/config change
  - `cd frontend && npm run build` when routing, layout, env, or rendering boundaries change
- If a check cannot run, record the command and exact blocker in the final response or TODO.
- Add or update focused tests for path traversal, trash/restore, permissions, upload/download limits, config changes, and log access when those areas change.

## Product Priorities

- The main screen should remain the usable file manager, not a marketing page.
- Optimize for repeated admin work: fast navigation, clear upload/download progress, predictable bulk actions, keyboard/focus behavior, and recoverable destructive actions.
- Remote deployment must be explicit: environment variables, Docker volumes, CORS origins, public URLs, HTTPS/reverse proxy assumptions, and backup expectations should be documented.
