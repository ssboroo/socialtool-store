# Socialtool.store growth features — production rollout

Implemented in this branch:
- Smart multilingual fuzzy search and header suggestions.
- Authenticated, account-isolated wishlists with product-card heart buttons and in-app price-drop alerts (compared with price at save time).
- Anonymous shopping engagement events (no IP, cookies or user ID are saved).
- Admin paid-order revenue, search insights and product funnel activity.
- Product health checks, duplicates, metadata and URL format checks.
- Shopping advisor: grounded current catalog recommendations + FAQ context. If `OPENAI_API_KEY` is set it uses the configured `AI_SHOPPING_MODEL` (default `gpt-4o-mini`) for a natural-language answer, otherwise a clearly labeled catalogue-based guided fallback. Human handoff opens existing live support chat.

## Production database prerequisite

New schema tables: `WishlistItem`, `AnalyticsEvent` and Product/Customer relations.

**Before merging a live auto-deployed branch or deploying code:** back up the production SQLite database, run `bunx prisma db push` against the production `DATABASE_URL` without `--accept-data-loss`, confirm both tables exist, then deploy the new code. Do not run `db:reset`.

### Optional AI provider
Set `OPENAI_API_KEY` only on the server. Optionally `AI_SHOPPING_MODEL`. Do not expose this key via `NEXT_PUBLIC_`. The assistant provides a guided catalog answer if the provider is unconfigured, unavailable or times out.

### Privacy and diagnostics
Analytics stores only event type, product ID, sanitized/truncated search term and timestamp. No session tracking or conversion-rate inference is performed. All monetary reporting comes from paid orders, not visitor events. Internal product metadata is checked automatically; remote links are format-checked rather than requested, avoiding server-side request forgery and accidental vendor traffic. The health dashboard scans on demand. The optional daily GitHub Actions schedule calls an authenticated cron route. External URLs are format-checked, not fetched.

## Optional daily health scans

1. Set a random `CRON_SECRET` (24+ characters) in the hosting service's private environment.
2. Under GitHub Actions secrets, set `SOCIALTOOL_HEALTH_CRON_URL` to `https://socialtool.store/api/cron/product-health` and `SOCIALTOOL_HEALTH_CRON_SECRET` to the same secret. **Never put the secret in source code or a public URL.**
3. `.github/workflows/product-health-daily.yml` runs daily at 03:00 UTC (11:00 Mongolia). If the secrets are missing, the action exits without running a scan. Telegram delivery additionally requires existing private `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID`.
4. Run `workflow_dispatch` once manually to verify the response and Telegram message. On-demand scanning remains available under Admin → Бараа шалгагч.

CI must pass lint, Next build, all unit tests and integration test before merging.
