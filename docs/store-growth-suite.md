# Socialtool.store growth features — production rollout

Implemented in this branch:
- Smart multilingual fuzzy search and header suggestions.
- Authenticated, account-isolated wishlists with product-card heart buttons.
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
Analytics stores only event type, product ID, sanitized/truncated search term and timestamp. No session tracking or conversion-rate inference is performed. All monetary reporting comes from paid orders, not visitor events. Internal product metadata is checked automatically; remote links are format-checked rather than requested, avoiding server-side request forgery and accidental vendor traffic. The health dashboard scans on demand.

CI must pass lint, Next build, all unit tests and integration test before merging.
