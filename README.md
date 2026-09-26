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

Bag sizes and prices, the service area, daily caps, book categories and most site
copy are admin-editable and live in the `settings` table. Changing them needs no
deploy.

## Environments and deploys

Push to `main` for production (givezy.in); push to `staging` for staging
(staging.givezy.in). Both build an image in GitHub Actions, push it to GHCR, and
the droplet pulls it. The two run side by side on the same box with separate
databases, uploads and environment files, so staging cannot touch real data.

Staging is set to `APP_ENV=staging`, which shows a banner on every page and makes
`robots.txt` disallow everything. `DEPLOY.md` has the details. The droplet never builds anything — it has 512 MB of memory and
a 10 GB disk, and building there used to take the site down for ten minutes.

Branches and pull requests run `build-check.yml`, which builds the image, then
boots it and waits for it to answer. That check exists because a Dockerfile
change once reached `main` and broke the build there; a working checkout hides
problems that only a clean container exposes.

## Things that will bite you

**Keep schema changes additive.** Deploys run `drizzle-kit push --force`, which
infers the schema rather than applying migrations, and will rebuild a table if a
column definition changes. Add columns and tables; don't alter existing ones.

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
