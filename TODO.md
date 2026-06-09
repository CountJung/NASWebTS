# NASWebTS TODO

Last reviewed: 2026-06-09

## P0 - Security And Remote Deployment

- [ ] Replace naive path containment checks with a shared safe-path helper that uses `path.resolve`, `path.relative`, and explicit root-boundary validation for files, trash, logs, restore metadata, rename targets, and uploads.
- [ ] Validate all backend request bodies/query params with DTOs or schemas: file path, folder name, rename target, restore file name, bulk path arrays, log path, line count, user role, and system config values.
- [ ] Remove JWT tokens from OAuth callback URLs. Move login state to secure, httpOnly, sameSite cookies or another flow that does not leak tokens through browser history, logs, or referrers.
- [ ] Add production CORS/origin configuration for remote access. Support explicit allowed origins instead of a single localhost-derived value.
- [ ] Add upload limits and safety controls: max file size, max file count, allowed/blocked names, reserved names, duplicate strategy, and clear error responses.
- [ ] Stream uploads to disk or a temporary file when files can be large. Current upload uses memory-backed Multer buffers and `fs.writeFile`.
- [ ] Add rate limiting and request-size limits for auth, upload/download, logs, and frontend log ingestion endpoints.
- [ ] Protect frontend log ingestion from unauthenticated spam or very large payloads.

## P1 - Correctness And Reliability

- [ ] Add focused backend tests for path traversal, trash permanent delete, restore metadata, duplicate restore names, rename edge cases, Korean filenames, and missing files.
- [ ] Make bulk delete/restore/download APIs first-class backend endpoints with partial-failure reporting instead of many client-side sequential requests.
- [ ] Make recent files include enough path metadata to open/download files outside the current directory.
- [ ] Replace sync filesystem calls in request paths with async equivalents where practical, especially logs and large directory traversal.
- [ ] Bound `getRecentFiles` traversal for very large NAS roots with pagination, max depth, cancellation, or an index/cache.
- [ ] Store users/config in a more robust persistence layer or add file locking/atomic writes to avoid JSON corruption under concurrent requests.
- [ ] Validate `JWT_SECRET`, Google OAuth settings, `ROOT_PATH`, ports, log retention, and admin emails at startup.
- [ ] Ensure Docker Compose passes all required OAuth/JWT/frontend env vars and mounts persistent `data/` and `logs/` volumes, not only `nas-storage`.

## P2 - Frontend UX And Maintainability

- [ ] Split `FileExplorer.tsx` into smaller hooks/components for query loading, mutations, toolbar, grid/list views, downloads, and dialogs.
- [ ] Add clear loading, disabled, success, and partial-failure states for uploads, downloads, delete, restore, and rename.
- [ ] Replace browser `confirm`/`alert` calls with MUI dialogs/snackbars for consistent UX and accessibility.
- [ ] Use the configured backend URL for direct single-file downloads instead of hardcoded `http://localhost:4000`.
- [ ] Add virtualization or `content-visibility` for large directories.
- [ ] Persist user preferences such as grid/list view and sort order with versioned localStorage data.
- [ ] Improve keyboard accessibility for file selection, open, menu, rename, delete, restore, and upload actions.
- [ ] Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for file dates and sizes instead of ad hoc formatting.

## P3 - Observability And Operations

- [ ] Add structured audit logs for user identity, action, safe relative path, outcome, duration, and request correlation ID.
- [ ] Ensure logs do not include secrets, bearer tokens, full local absolute paths, or oversized frontend payloads.
- [ ] Add health endpoints for backend readiness, storage root accessibility, writable data/log directories, and OAuth config presence.
- [ ] Document remote deployment steps for Mac mini usage: reverse proxy/HTTPS, firewall, Docker volumes, backup, restart, and environment templates.
- [ ] Add CI commands for frontend lint/build and backend test/build.

## Current Verification Notes

- [x] Ran `cd frontend && npm run lint`; fixed the reported lint errors/warnings in touched frontend files.
- [x] Ran `cd backend && npm test -- --runInBand`; fixed missing provider mocks in basic Nest specs.
- [x] Ran `cd backend && npm run build`; Nest build passed.
- [x] Ran `cd frontend && npm run build`; Next build passed on `next@16.2.7`.
- [x] Ran `cd frontend && npm audit --audit-level=moderate`; frontend audit reports 0 vulnerabilities after dependency updates and `postcss` override.
