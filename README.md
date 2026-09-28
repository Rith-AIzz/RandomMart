# RandomMart

RandomMart is a polished multi-category e-commerce portfolio project built with Next.js, TypeScript, Supabase, PostgreSQL, Prisma, and a security-first layered architecture. The deployed site runs in an explicitly labeled local preview mode; the repository also includes the production database, authentication, authorization, storage, transactional checkout, validation, and testing foundations needed to connect a Supabase project.

## Features

- Responsive editorial storefront with 6 categories and 20 realistic products
- Search, category, price, featured, and sorting URL parameters
- Product details, sale labels, low-stock states, and out-of-stock handling
- Persistent guest cart with authoritative integer-cent calculations
- Local sign-in, protected checkout, harmless payment choice, confirmation, and order history
- Customer profile and shipping-address interface
- Admin dashboard, catalog, category, customer, inventory, and order views
- Four scoped roles: customer, support, manager, and administrator
- Supabase Auth client/server/admin boundaries and profile creation trigger
- PostgreSQL schema, RLS policies, Storage bucket policies, and Prisma models
- Transactional, idempotent server-side order service with safe inventory decrement
- Zod schemas, security headers, accessible states, Vitest coverage, and Playwright journeys

## Architecture

The App Router is organized as an MVC-inspired layered application:

- **Models:** `prisma/schema.prisma`, Supabase SQL, and TypeScript domain types
- **Views:** `app/` routes and reusable `components/`
- **Controllers:** Route Handlers and future Server Actions remain thin
- **Services:** `services/` holds authorization and transactional workflows
- **Repositories:** `repositories/` owns reusable Prisma queries
- **Validation:** `schemas/` provides shared Zod contracts
- **Security:** Supabase RLS is defense-in-depth; server-side ownership and role checks remain mandatory

Prisma is the source of truth for the application model. `supabase/migrations/001_initial.sql` mirrors it while adding Supabase-specific auth triggers, RLS, and Storage policies. When changing tables, update Prisma first, generate a reviewed migration, and then update the Supabase-specific policy migration in the same change.

## Local setup

Prerequisites: Node.js 22+, npm, a Supabase project, and PostgreSQL connection credentials.

1. Copy `.env.example` to `.env.local` and provide your own values. Never commit this file or paste secret/database keys into client code.
2. Install dependencies with `npm ci`.
3. Run `npm run prisma:generate`.
4. Validate with `DIRECT_URL=... npm run prisma:validate`.
5. Apply the SQL migration in Supabase or use a reviewed Prisma migration plus the Supabase policy/storage statements.
6. Seed sample data with `npm run prisma:seed`.
7. Start development with `npm run dev`.

Environment variables:

- `DATABASE_URL`: pooled PostgreSQL URL used by Prisma at runtime.
- `DIRECT_URL`: direct PostgreSQL URL used for migrations, validation, and seeding.
- `NEXT_PUBLIC_SUPABASE_URL`: identifies the Supabase project.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser-safe key used only behind RLS. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` name is still accepted during migration.
- `SUPABASE_SECRET_KEY`: server-only key that bypasses RLS; never expose it with `NEXT_PUBLIC_`. The legacy `SUPABASE_SERVICE_ROLE_KEY` name is still accepted.
- `NEXT_PUBLIC_SITE_URL`: trusted base URL for auth redirects.
- `STORE_TIME_ZONE`: optional IANA timezone for dashboard reporting, such as `Asia/Bangkok`.
- `ADMIN_EMAIL`: email of an existing verified user to promote in development.

## Supabase setup

1. Create a Supabase project and copy the pooled and direct PostgreSQL URLs.
2. Run `supabase/migrations/001_initial.sql` in a new project.
3. Run `supabase/migrations/002_hardening.sql` to add the default-address constraint and hardened profile policy.
4. Run `supabase/migrations/003_staff_roles.sql` to add manager/support roles and their scoped RLS policies.
5. Run `supabase/migrations/004_preview_naming.sql` to update test-payment naming on existing databases.
6. Run `supabase/migrations/005_analytics_foundation.sql` to add profitability snapshots, saved reports, and notifications.
7. Run `supabase/migrations/006_commerce_growth.sql` to add persistent wishlists, verified reviews, variants, and inventory history.
8. Confirm RLS is enabled on every public table and inspect each policy.
9. Confirm the public `product-images` bucket allows only JPEG, PNG, and WebP up to 5 MB.
10. Configure Auth site URL and allowed redirect URLs using `NEXT_PUBLIC_SITE_URL`.
11. Enable email confirmation and configure an SMTP provider for real email delivery.
12. Create a normal account, verify its email, set `ADMIN_EMAIL`, then run `npm run admin:promote`. The script refuses unverified accounts and reads credentials only from the server environment.

## Roles and permissions

| Role       | Access                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| `CUSTOMER` | Own profile, addresses, cart, checkout, and orders                     |
| `SUPPORT`  | Customer directory and order management                                |
| `MANAGER`  | Support access plus products, categories, inventory, and image uploads |
| `ADMIN`    | Full staff access, audit log, and role assignment                      |

Only administrators can assign roles. The final administrator's role cannot be changed, preventing an accidental lockout.

Product upload handlers must verify the administrator on the server, inspect actual file signatures, enforce size and MIME allowlists, randomize object names under `products/<product-id>/`, and remove abandoned replacement files. The service-role key must never enter a Client Component.

## Checkout integrity

`services/order.service.ts` implements the production workflow: authenticate the owner, validate an idempotency key, load the owner’s active cart and address, re-read prices and stock, atomically decrement inventory, snapshot purchased product data, create a simulated payment record, clear the cart, and commit under `Serializable` isolation. All money uses integer minor units; browser totals are never authoritative.

## Commands

| Command                   | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `npm run dev`             | Start the development site                  |
| `npm run build`           | Create and validate the production artifact |
| `npm run lint`            | Run ESLint                                  |
| `npm run typecheck`       | Run strict TypeScript checks                |
| `npm run test:unit`       | Run Vitest unit tests                       |
| `npm run test:e2e`        | Run Playwright journeys                     |
| `npm run prisma:generate` | Generate the Prisma client                  |
| `npm run prisma:validate` | Validate the database model                 |
| `npm run prisma:seed`     | Seed 6 categories and 20 products           |
| `npm run admin:promote`   | Promote one verified development account    |

The standard development, build, lint, and E2E commands are cross-platform. `npm run install:sites` remains available for the specialized Linux Sites CI environment.

## Security notes

- Supabase Auth owns passwords and credentials; RandomMart has no password table.
- Customer and admin operations require server-side identity, ownership, and role checks.
- Customers cannot update their role, prices, inventory, totals, payment status, or order status.
- RLS protects browser-accessible operations but never replaces application authorization.
- Open redirects are prevented by accepting only same-origin relative return paths.
- The preview UI never asks for real card numbers, security codes, or payment information.
- Logs must exclude passwords, tokens, cookies, credentials, full personal profiles, and payment data.

## Testing strategy

Unit tests cover money calculations, invalid quantities, guest-cart merging, and status transitions. Playwright covers storefront browsing, adding a product, responsive rendering, and admin visibility. A connected Supabase test project should use isolated users and resettable seed data for registration, RLS isolation, transactional checkout, idempotency, and administrator mutation tests.

## Deployment and limitations

The hosted portfolio is intentionally safe and self-contained: catalog, cart, local session, checkout, order history, and admin exploration work without external credentials. Live Supabase authentication, email delivery, persistent multi-user orders, database migrations, and Storage uploads require a configured Supabase project and could not be exercised without user-owned secrets. Real payment processing is intentionally out of scope.

Persistent wishlists, saved-address management, moderated verified-purchase reviews, product variants, and inventory history are included. A real payment provider remains intentionally out of scope until a dedicated PCI/security design review.

## Screenshots

Add desktop, mobile storefront, checkout, order history, and administrator dashboard screenshots here after connecting the final deployment.
