# Product sharing and storefront finishing

The existing `/share/product/[id]` route remains the canonical public share URL. The existing admin Facebook workspace is preserved. Product detail, admin product rows and quick editing now expose direct Facebook sharing; expanded controls also copy the link. They open Facebook's composer and never publish automatically.

## Preview images

- Uploaded images are read from `UploadedImage` first, with the existing upload directory as a legacy fallback.
- Local public raster/SVG assets receive a 1200×630 PNG card with the product name, category, short description and unchanged Socialtool logo. Missing/unreadable artwork falls back to the brand mark.
- External public HTTPS images are passed directly to Open Graph metadata. The server never fetches arbitrary product URLs. These external previews use the original image rather than the generated card layout.
- Image metadata includes an update timestamp in its URL; PNG responses cache for five minutes. Facebook may retain its own cached preview until re-scraped in the Sharing Debugger.
- Unavailable/deleted products remain excluded from public sharing as before. The image endpoint returns 404. Next's streamed page not-found state carries `noindex`.
- `NEXT_PUBLIC_SITE_URL` must identify the public HTTPS site when building production. Local URLs are not crawlable by Facebook.

The bundled `noto-sans-share.ttf` is Noto Sans Regular from https://github.com/notofonts/noto-fonts/blob/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf, under the existing `public/fonts/NotoSans-OFL.txt` license. It ensures Cyrillic Mongolian text renders in generated PNGs without operating-system fonts.

## Existing storefront compatibility

Based on current main `dd8e9b9`; its smart search, wishlist, real brand icons, dynamic hero, free downloads, order-link requirements and business logic are preserved. The approved glass promo is reusable on desktop and mobile; existing floating icons gain hover lift and lighter mobile motion. Header/footer/promo scrolling now respects reduced-motion preferences. No catalog records, prices, reviews, logo assets or payment code are changed.

## Validation

- Lint, TypeScript/production build; the upstream product-health filesystem tracing warnings are unrelated to sharing.
- 34 Node unit/integration tests, including catalog, checkout, account isolation, payment amount protection, smart commerce and share URL validation.
- Integration verifies Facebook crawler metadata, actual DB-uploaded image pixels in a 1200×630 PNG, external-image metadata and unavailable-product protection.
- Browser coverage: desktop/mobile widths, pause/reduced motion, mobile promo, share/copy targets, existing purchase modal, admin row/editor buttons, customer account error/retry and logout race.
- The Linux/Bun-only production-startup rehearsal remains in CI; not run on this Windows host.

All preview data is confined to a temporary local database. No Facebook post or production payment was made. Push does not by itself confirm deployment or Facebook's live cache.
