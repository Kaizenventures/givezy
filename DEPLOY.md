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

### Manual deploy (if CI/CD isn't set up yet)
```bash
cd ~/givezy && git pull origin main && docker compose down && docker compose up -d --build
```

### Restart without rebuilding
```bash
cd ~/givezy && docker compose restart
```

### Backup database
```bash
docker cp givezy-app-1:/app/data/givezy.db ~/givezy-backup-$(date +%F).db
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

> **Status: NOT WORKING.** The `DROPLET_IP` and `SSH_PRIVATE_KEY` secrets have
> never been added, so every run fails immediately with
> `error: missing server host`. Until step 3 below is done, pushing to `main`
> does **not** update the server — deploy manually with the command under
> "Manual deploy" above.

Once set up, every push to `main` auto-deploys. One-time setup:

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
captured payment attached to an unpaid donation, with nothing to reconcile it.

### Shipping (add when Shiprocket access arrives)
`SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, plus the `PICKUP_*` warehouse address
used as the shipping destination.

### Demo mode
| Variable | Notes |
|---|---|
| `DEMO_MODE` | `true` skips checkout and records donations as paid |

Demo mode requires `DEMO_MODE=true` **and** the absence of `RAZORPAY_KEY_ID`.
Adding real keys disables it automatically, so it cannot silently give away free
pickups. It shows a warning banner on the donate page, the thank-you page and
throughout the admin panel. Demo payments are stored with a `demo_` payment id.

### Email (optional — no-ops when unset)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`,
`ADMIN_NOTIFY_EMAIL`. When configured, a paid donation emails both the donor
(confirmation and next steps) and the team. Mail failures are logged and never
block a donation.

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

# Build and launch
docker compose up -d --build
```

---

## Troubleshooting

**502 Bad Gateway?**
→ App container probably crashed. Check: `docker compose logs app --tail 30`

**Build killed?**
→ Out of memory. Make sure swap is on: `swapon --show`

**DNS not working?**
→ Check Porkbun DNS: A record `@` → 157.245.102.139, A record `www` → 157.245.102.139

**SSL not working?**
→ Caddy auto-provisions. Just wait a minute, or check: `docker compose logs caddy --tail 20`

**Need to change admin password?**
→ Edit `~/givezy/.env`, change ADMIN_PASSWORD, then:
```bash
docker compose down && docker compose up -d --build
```

---

## Cost Breakdown
| Item | Cost |
|------|------|
| DigitalOcean droplet (Bangalore) | $4/mo |
| givezy.in domain (Porkbun) | ~$7/yr (~$0.60/mo) |
| SSL (Let's Encrypt via Caddy) | Free |
| CI/CD (GitHub Actions) | Free |
| **Total** | **~$4.60/mo** |
