# Givezy

Paid doorstep book pickups in Hyderabad. Someone books a collection, pays a fee,
receives an empty kraft bag in the post, fills it, and a courier collects it.

- **Live:** [givezy.in](https://givezy.in)
- **Admin:** [givezy.in/admin/login](https://givezy.in/admin/login)

## Docs

| Document | For |
|---|---|
| [OVERVIEW.md](./OVERVIEW.md) | What Givezy is and how it works, in plain language — start here |
| [ADMIN.md](./ADMIN.md) | Running pickups day to day, written for a non-technical operator |
| [DEPLOY.md](./DEPLOY.md) | Servers, environment variables, deploys, backups |

## Stack

Next.js 16 (App Router) · Drizzle ORM on libSQL/SQLite · NextAuth (admin only) ·
Razorpay · Shiprocket · Leaflet + OpenStreetMap · Tailwind v4 · Docker behind Caddy
on a single DigitalOcean droplet.

## Running locally

```bash
npm install
npx drizzle-kit push --force        # creates ./data/givezy.db
npm run db:seed                     # seeds an admin login
npm run dev
```

Put local secrets in `.env.local` (gitignored). With no Razorpay credentials the
give page collects interest instead of taking payment. To walk the whole flow,
set `DEMO_MODE=true`: checkout is skipped and bookings are recorded as paid.
Demo mode refuses to run once real Razorpay keys are present, so it cannot
quietly hand out free pickups.

## How a booking flows

1. `/donate` — category, photos, book categories, the bag, and contact details
   on one page. The pincode is checked against the service area as it is typed.
2. `POST /api/donate` — re-checks capacity and serviceability server-side, prices
   the booking from settings (never from the client), stores it as
   `pending_payment` and opens a Razorpay order.
3. Razorpay checkout, then `POST /api/shipping/verify`.
4. `POST /api/webhooks/razorpay` settles the payment independently, so a closed
   tab cannot strand a captured payment. Both paths go through `settlePayment()`
   and are idempotent.
5. Admin posts the bag, the giver confirms on WhatsApp, admin records the pickup
   — through Shiprocket when it is connected, by hand when it is not.

Refunds mirror that shape: `recordRefund()` is reached from the admin panel and
from the webhook's refund events, deduplicates on the Razorpay refund id, and on
a full refund marks the donation `refunded` — which releases its capacity slot,
because `checkCapacity()` reads `NON_CONSUMING_STATUSES` rather than listing
statuses itself. `settlePayment()` refuses an already-refunded shipment, since
Razorpay re-delivers `payment.captured`.

Subscribe the webhook to `payment.captured`, `payment.failed`, `refund.created`
and `refund.processed`.

`npx tsx scripts/test-refunds.ts` exercises all of this against a throwaway
database (`DATABASE_URL=file:/tmp/t.db`, after `node scripts/migrate.mjs`).

Bag sizes and prices, the service area, daily caps, book categories and most site
copy are admin-editable and live in the `settings` table. Changing them needs no
deploy.

## Deploys

Push to `main` and GitHub Actions builds the image, pushes it to GHCR, and the
droplet pulls it. The droplet never builds anything — it has 512 MB of memory and
a 10 GB disk, and building there used to take the site down for ten minutes.

Branches and pull requests run `build-check.yml`, which builds the image, then
boots it and waits for it to answer. That check exists because a Dockerfile
change once reached `main` and broke the build there; a working checkout hides
problems that only a clean container exposes.

## Things that will bite you

**Keep schema changes additive.** Deploys run `scripts/migrate.mjs`, which applies
`drizzle/*.sql` in order and skips statements already present. It is deliberately
not `drizzle-kit push`, which needs a TTY, exits zero when it cannot get one, and
once left production running the pre-refactor schema while the app started
anyway. Add columns and tables; don't alter existing ones.

**A saved setting beats the code.** Bags, prices, caps, copy and the service area
live in the `settings` table, and once saved, editing `DEFAULT_BAGS` or any other
default has no effect on a running install. Changing one of those for real means
a data migration — see `drizzle/0006_packing_limit_slab.sql`.

**Couriers charge by slab, not by the gram.** The packing limit plus the sack's
tare is what gets declared, and a limit just over a boundary pays for a whole
band it cannot use. `src/lib/courier-slabs.ts` works this out and Settings shows
it live; it went unnoticed at ₹80 a pickup before that existed.

**Next only traces what the server imports.** The image ships Next's standalone
output, so `node_modules` contains just the files the running server reaches. The
entrypoint runs migrations and the seed as separate processes, which is why the
Dockerfile copies complete `drizzle-orm`, `@libsql` and `bcryptjs` over the
traced ones, and why those packages are listed in `serverExternalPackages`.

**Migration tooling lives in `/opt/tools`,** not the app's `node_modules`, because
an `npm install` inside a traced bundle can prune what the server needs. That is
also why `drizzle.config.ts` exports a plain object instead of calling
`defineConfig()` — importing drizzle-kit there makes the config unresolvable at
runtime.

**Editing `.env` on the droplet does nothing until the container is recreated.**
`docker compose restart` is not enough; see DEPLOY.md.
