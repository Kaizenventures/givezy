# Givezy — Deployment & Operations Cheatsheet

## Your Setup
- **Droplet IP:** 157.245.102.139
- **Domain:** givezy.in (Porkbun)
- **Repo:** github.com/Kaizenventures/givezy
- **Admin:** https://givezy.in/admin/login — day-to-day guide in [ADMIN.md](./ADMIN.md)
- **Razorpay webhook:** https://givezy.in/api/webhooks/razorpay
- **Cost:** ~$4.60/mo

---

## Quick Reference (copy-paste commands)

### SSH into your server
```bash
ssh root@157.245.102.139
```

### View logs (live)
```bash
cd ~/givezy && docker compose logs -f app
```

### View last 50 log lines
```bash
cd ~/givezy && docker compose logs app --tail 50
```

### Deploy by hand (normally GitHub Actions does this)
```bash
cd ~/givezy && git pull origin main && docker compose pull app && docker compose up -d
```

### After editing .env
A restart is **not** enough — a container keeps the environment it was created
with. Recreate it:
```bash
cd ~/givezy && docker compose up -d --force-recreate app
```

### Back up right now
```bash
/root/givezy/scripts/backup.sh && ls -lh /root/backups
```

### Check disk space
```bash
df -h
```

### Check memory / swap
```bash
free -h
```

---

## CI/CD (Auto-Deploy on Push)

Every push to `main` builds a Docker image in GitHub Actions, pushes it to GHCR,
and the droplet pulls it. A deploy can also be re-run from the Actions tab.

**The droplet never builds anything.** It has 512 MB of memory and a 10 GB disk;
building Next.js there needed a swapfile, filled the disk twice and took the site
down for ten minutes a time. Deploys are now a pull and a restart.

Deploys pin the exact commit's image rather than `:latest`, so a later restart
cannot silently pick up a different build. To roll back, run on the droplet:

```bash
cd ~/givezy && GIVEZY_IMAGE=ghcr.io/kaizenventures/givezy-app:<sha> docker compose up -d
```

To build by hand if GHCR is ever unreachable:

```bash
cd ~/givezy && docker build -t ghcr.io/kaizenventures/givezy-app:latest . && docker compose up -d
```

**Secrets** (`DROPLET_IP`, `SSH_PRIVATE_KEY`) are configured. The registry is
authenticated with each run's own short-lived token, so no long-lived credential
sits on the droplet.

### Build check

Branches and pull requests run `build-check.yml`: it builds the image, boots it,
and waits for it to answer on port 3000. It does not deploy.

This exists because a Dockerfile change once reached `main` and broke the build
there. A working checkout hides problems that only a clean container finds — a
missing directory, a package Next inlined rather than shipped, a config that
cannot resolve its own tooling. If that check is red, do not merge.

To regenerate the deploy key:

### 1. Generate an SSH key for GitHub Actions
On your local machine (NOT the droplet):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/givezy-deploy -N ""
```

### 2. Add the public key to your droplet
```bash
cat ~/.ssh/givezy-deploy.pub | ssh root@157.245.102.139 "cat >> ~/.ssh/authorized_keys"
```

### 3. Add secrets to GitHub
Go to: github.com/Kaizenventures/givezy/settings/secrets/actions

Add these two secrets:
- **DROPLET_IP** → `157.245.102.139`
- **SSH_PRIVATE_KEY** → paste the contents of `~/.ssh/givezy-deploy` (the private key, NOT .pub)

That's it. Now every `git push origin main` auto-deploys.

---

## Environments

Two, on the same droplet, sharing nothing but the machine and Caddy.

| | Production | Staging |
|---|---|---|
| URL | givezy.in | staging.givezy.in |
| Deploys from | `main` | `staging` branch |
| Database | `app-data` volume | `staging-data` volume |
| Uploads | `app-uploads` volume | `staging-uploads` volume |
| Config | `.env` | `.env.staging` |
| Payments | live keys | demo mode, or Razorpay **test** keys |
| Search engines | indexed | `robots.txt` disallows everything |
| Host port | 3000 | 3001 |

Staging shows an amber banner on every page so it can never be mistaken for the
real site, and its metadata points at its own host.

### Putting something on staging

```bash
git push origin HEAD:staging
```

That builds the image, tags it `staging-<sha>` and restarts only the staging
container. Production is untouched.

One wrinkle worth knowing: the compose file and Caddyfile always come from
`main`. Staging runs main's infrastructure with the staging branch's
application image, so **infrastructure changes have to reach `main` before they
take effect anywhere** — including on staging.

### The staging admin login

Generated when `.env.staging` was created. To read it:

```bash
grep ADMIN_PASSWORD ~/givezy/.env.staging
```

### Giving staging real checkout

It runs in demo mode by default, so it cannot take a payment even by accident.
To exercise real Razorpay checkout, uncomment the `RAZORPAY_*` lines in
`.env.staging` and fill in **test** keys, then:

```bash
cd ~/givezy && docker compose up -d --force-recreate staging
```

Never put live keys in that file.

### DNS

`staging.givezy.in` needs an A record pointing at the droplet, the same as
`givezy.in`. Caddy issues its certificate automatically once that resolves.

---

## Backups

`scripts/backup.sh` runs nightly at 03:00 IST from root's crontab. It writes to
`/root/backups`:

- `db-<date>.db.gz` — a consistent snapshot taken with `sqlite3 .backup`, kept 14 days
- `uploads-current/` — a mirror of the photo volume, not a dated archive

Photos are mirrored rather than archived because there are already 74 MB of them
and fourteen dated copies would fill the disk.

Check it ran:

```bash
tail -5 /var/log/givezy-backup.log && ls -lh /root/backups
```

### Restoring

```bash
cd ~/givezy && docker compose down
gunzip -c /root/backups/db-YYYY-MM-DD-HHMM.db.gz > /tmp/restore.db
cp /tmp/restore.db "$(docker volume inspect givezy_app-data --format '{{.Mountpoint}}')/givezy.db"
rsync -a /root/backups/uploads-current/ "$(docker volume inspect givezy_app-uploads --format '{{.Mountpoint}}')/"
docker compose up -d
```

### These are still on the same droplet

Local backups protect against a bad migration or a corrupted database. They do
**not** protect against losing the droplet, which currently holds the only copy
of every booking, every giver's address and every photo. Two ways to fix that:

- **DigitalOcean snapshots** — enable weekly backups on the droplet in the DO
  control panel. No keys, a couple of clicks, roughly $1–2/month. Weekly means
  up to seven days of bookings could be lost, so it is a floor rather than a
  target once real money is moving.
- **Off-box copies** — install `rclone`, configure a bucket, and set
  `BACKUP_REMOTE` in the crontab entry. The script already handles it.

---

## Environment Variables

Set these in `~/givezy/.env` on the droplet.

### Required
| Variable | Notes |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://givezy.in` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeds the admin login on first boot |

### Payments (add when Razorpay access arrives)
| Variable | Notes |
|---|---|
| `RAZORPAY_KEY_ID` | Also injected at build time for the checkout widget |
| `RAZORPAY_KEY_SECRET` | Server-side only |
| `RAZORPAY_WEBHOOK_SECRET` | Must match the secret set on the webhook in the Razorpay dashboard |

**Set up the webhook** in Razorpay → Settings → Webhooks:
- URL: `https://givezy.in/api/webhooks/razorpay`
- Events: `payment.captured` and `payment.failed`
- Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`

Without the webhook, a donor who closes the tab immediately after paying leaves a
captured payment attached to an unpaid booking, with nothing to reconcile it.

### Shipping (add when Shiprocket access arrives)
`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, plus the `PICKUP_*` warehouse address
used as the shipping destination.

### Demo mode
| Variable | Notes |
|---|---|
| `DEMO_MODE` | `true` skips checkout and records bookings as paid |

Demo mode requires `DEMO_MODE=true` **and** the absence of `RAZORPAY_KEY_ID`.
Adding real keys disables it automatically, so it cannot silently give away free
pickups. It shows a warning banner on the give page, the thank-you page and
throughout the admin panel. Demo payments are stored with a `demo_` payment id.

### Email (optional — no-ops when unset)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`,
`ADMIN_NOTIFY_EMAIL`. When configured, a paid booking emails both the giver
(confirmation and next steps) and the team. Mail failures are logged and never
block a booking.

For Gmail, use an [App Password](https://myaccount.google.com/apppasswords) with
`SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=587` — not the account password.

---

## Timezone

The container runs `TZ=Asia/Kolkata` with `tzdata` installed. This matters: the
daily/weekly/monthly pickup caps roll over at IST midnight and admin dates render
in IST. Alpine ignores `TZ` unless `tzdata` is present, so do not remove it from
the Dockerfile.

---

## First-Time Server Setup (already done, for reference)

```bash
ssh root@157.245.102.139

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add swap (needed for 512MB droplet)
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Clone and setup
git clone https://github.com/Kaizenventures/givezy.git
cd givezy

# Create env file
cat > .env << 'EOF'
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://givezy.in
ADMIN_EMAIL=kaizen.labsindia@gmail.com
ADMIN_PASSWORD=<your-secure-password>
DATABASE_URL=file:./data/givezy.db
EOF

# Fix Caddyfile to use Docker networking
cat > Caddyfile << 'EOF'
givezy.in {
    reverse_proxy app:3000
    encode gzip
}
EOF

# Pull the image built by CI and launch
docker compose pull app && docker compose up -d
```

---

## Troubleshooting

**502 Bad Gateway?**
→ App container probably crashed. Check: `docker compose logs app --tail 30`

**Changed .env but nothing happened?**
→ Containers keep the environment they were created with. `docker compose up -d
--force-recreate app`, not `restart`.

**Deploy went red but the site is fine?**
→ Check whether it failed on the health check rather than the deploy. The app
runs migrations and seeds before answering, which takes a while on this box.

**Disk filling up?**
→ `docker builder prune -af` and `journalctl --vacuum-size=50M`. Deploys prune
old images automatically; two images do not fit on this disk.

**Build killed?**
→ Out of memory. Make sure swap is on: `swapon --show`

**DNS not working?**
→ Check Porkbun DNS: A record `@` → 157.245.102.139, A record `www` → 157.245.102.139

**SSL not working?**
→ Caddy auto-provisions. Just wait a minute, or check: `docker compose logs caddy --tail 20`

**Need to change admin password?**
→ Edit `~/givezy/.env`, change ADMIN_PASSWORD, then:
```bash
docker compose up -d --force-recreate app
```

---

## Cost Breakdown
| Item | Cost |
|------|------|
| DigitalOcean droplet (Bangalore) | $4/mo |
| Weekly snapshots (recommended, not yet enabled) | ~$1-2/mo |
| Container registry (GHCR) | Free |
| givezy.in domain (Porkbun) | ~$7/yr (~$0.60/mo) |
| SSL (Let's Encrypt via Caddy) | Free |
| CI/CD (GitHub Actions) | Free |
| **Total** | **~$4.60/mo** |
