# Socialtool.store — live site recovery after smart-commerce merge

## What was broken

The five shopping features were merged in PR #40. The public Next.js page and API now select `Product.searchKeywords`, `Wishlist` and `AnalyticsEvent`; a running production SQLite database from the previous release may not have these objects. GitHub CI used a **fresh isolated** database and therefore cannot prove the live database was upgraded. An unrelated second implementation in PR #42 was closed to avoid duplicate, incompatible Prisma schemas.

## Safe fix in this change

Standard `bun run start` now starts `scripts/start-production.mjs` before Next.js:
1. Resolve the existing `DATABASE_URL` to a file. Refuse missing/empty files instead of silently creating a new, empty store.
2. On Railway, check that the database lives inside the existing persistent `RAILWAY_VOLUME_MOUNT_PATH` volume. For the previous setup, this should be `file:/data/socialtool.db` on volume `/data`.
3. Verify SQLite integrity and identify required tables and columns.
4. If older, create a **consistent SQLite snapshot** using `VACUUM INTO` at `/data/.socialtool-db-backups/pre-schema-*.sqlite` (same persistent volume), verify its integrity and restrict file permissions. Keep an independent/off-platform backup as well.
5. Only after a valid backup, run `bunx prisma db push --skip-generate`. Never use `--accept-data-loss`, `--force-reset` or `db reset`. Abort startup on any warning/failure requiring manual data-loss consent.
6. Recheck schema and start the existing standalone Next.js server.
7. On future restarts with a compatible schema, skip migration and backup automatically.

**Production startup must use `bun run start`**, not `bun .next/standalone/server.js` directly. If your Railway service has a custom start command, change it in Settings → Deploy. Do not use Railway's pre-deploy command for this SQLite migration: it runs without the service's mounted volume.

If `DATABASE_URL` points to a missing DB, do not set up a new one: locate/reconnect the original production volume. Never commit production SQLite or secrets to GitHub. Set `RAILWAY_VOLUME_MOUNT_PATH` only via Railway's existing mount (provided automatically); do not fake it.

## Readiness verification

- `GET https://socialtool.store/api/health/ready`: `200 {"status":"ok",...}` means the running code can see the expected tables and columns.
- `503 {"status":"not_ready","reason":"schema_migration_required"}`: deployment is running code with an older SQLite schema, or migration not applied.
- `503 ... "database_unavailable"`: DB path/permissions or database connectivity issue.
- `404`: the new code is not live, or a proxy is routing traffic to an older service.
- For manual testing on an isolated SQLite copy: `bun scripts/start-production.mjs --check-only`.

Then test search, product heart button/login/wishlist isolation, AI catalog fallback, admin analytics, admin product health, and the existing QPay/Wire checkout using a normal test order. Gemini free-form responses require a valid server-side `GEMINI_API_KEY`; the catalog advisor works without it. Daily scan notifications require `PRODUCT_HEALTH_CRON_SECRET` configured both in production and GitHub Actions, plus Telegram bot/chat credentials.

## Operations and limitations

- The startup hook runs only when the hosting service uses the repository's `start` script and has the full application with the Prisma CLI installed (the `prisma` package is a production dependency). Repackaged standalone-only Docker images need to ship the script, Prisma CLI and schema explicitly.
- Deploy with one instance during the SQLite schema upgrade. Keep backups off-site. If the migration reports data-loss warnings, stop and inspect the schema change manually.
- The new `/api/health/ready` endpoint returns only status, feature names and optional abbreviated Railway commit SHA; never DB paths or secret values.
- GitHub checks confirm code correctness on isolated test data, **not** the running production database. Confirm the actual Railway project/service, volume and latest deployment/healthcheck before reporting the live site fully restored.

## CI regression

A separate test clones the isolated CI database, removes the just-added feature tables/column to simulate the previous version, plants a sentinel record, then runs the production startup guard. It verifies the snapshot, preserved sentinel, additive migration, idempotent second boot and refusal to create a replacement for a missing database.
