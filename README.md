# Givezy

Book donation pickups in Hyderabad. Donors book and pay for a doorstep pickup,
receive a de-clutter bag, pack it, and a courier collects it.

- **Live:** [givezy.in](https://givezy.in)
- **Admin:** [givezy.in/admin/login](https://givezy.in/admin/login)

## Docs

| Document | For |
|---|---|
| [ADMIN.md](./ADMIN.md) | Running donations day to day — written for a non-technical operator |
| [DEPLOY.md](./DEPLOY.md) | Servers, environment variables, deploys |

## Stack

Next.js 16 (App Router) · Drizzle ORM on libSQL/SQLite · NextAuth (admin only) ·
Razorpay · Shiprocket · Tailwind v4 · Docker behind Caddy.

## Running locally

```bash
npm install
npx drizzle-kit push --force        # creates ./data/givezy.db
npm run db:seed                     # seeds an admin login
npm run dev
```

Without Razorpay credentials the donate page collects interest instead of taking
payment. To walk the full flow locally, add `DEMO_MODE=true` to `.env.local` —
checkout is skipped and donations are recorded as paid. Demo mode turns itself
off as soon as real Razorpay keys are present.

## How the donation flow works

1. `/donate` — category, photos, size (by book count or by weight), donor details.
2. `POST /api/donate` — prices the booking server-side, creates the donation as
   `pending_payment` and opens a Razorpay order.
3. Razorpay checkout, then `POST /api/shipping/verify`.
4. `POST /api/webhooks/razorpay` settles the payment independently, so a closed
   tab can't strand a captured payment. Both paths share `settlePayment()` and
   are idempotent.
5. Admin posts the bag, the donor confirms on WhatsApp, admin books the courier.

Pricing, daily caps, site copy and book categories are all admin-editable and
stored in the `settings` table — no deploy needed to change them.

## Schema changes

Deploys run `drizzle-kit push --force` against live data, which will rebuild a
table if a column definition changes. **Keep migrations additive** — add columns
and tables, don't alter existing ones — or the donations table gets recreated and
data can be lost.
