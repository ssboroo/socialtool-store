# Premium storefront implementation plan

**Goal:** Apply the user's approved airy white / pale blue direction across the customer storefront while preserving logo, Mongolian content, products, prices, APIs and purchase flows.

**Architecture:** Keep existing Next.js routes, Radix dialogs, Zustand stores and server data queries. Add a scoped presentation layer shared by the storefront and its portal surfaces. Do not touch backend/payment integrations.

**Reference:** The linked conversation exposes the original screenshot but not the final generated preview. Follow the user's explicit written design direction; do not claim pixel matching or awards.

## Audit

- Public route: `src/app/page.tsx`; customer detail, authentication, account, notifications, cart and checkout use dialogs/drawers.
- Six legacy CSS files are loaded globally. Keep compatibility rules; put the new scoped system last, avoiding admin changes.
- Product fetching silently ignores errors. Add an announced error and explicit retry; retain cancellation and current query parameters.
- Hero settings and media must remain data driven. Logo component and image assets are immutable for this change.

## Implementation

- [x] Add `src/app/premium-storefront.css`: shared canvas, surface, ink, line, shadow and radius tokens; restrained gradients; responsive hero, compact catalog, sidebar, chips and service surfaces. Scope portal styles with `customer-surface`.
- [x] Add category chips using existing category state, loading skeletons and fetch retry in `featured-products.tsx`; preserve sorting/search events and product handlers.
- [x] Add skip link and route loading/error/not-found screens; improve customer dialog descriptions and input labels.
- [x] Apply consistent customer surface classes to detail/auth/account/checkout/cart/notifications and lower-page sections.
- [x] Install dependencies, run lint, TypeScript, unit tests, production build and isolated integration checks where supported. Inspect desktop/tablet/mobile, keyboard focus and reduced motion.
- [x] Review final diff, verify logo/API/store files unchanged, commit and push to existing `main` branch as requested.

## Verification boundaries

Use local isolated SQLite data for preview and integration tests. Never submit a real payment or use production credentials. Record environment limitations and existing failures honestly.
