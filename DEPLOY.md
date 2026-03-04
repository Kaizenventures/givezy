# Givezy — Deployment & Operations Cheatsheet

## Your Setup
- **Droplet IP:** 157.245.102.139
- **Domain:** givezy.in (Porkbun)
- **Repo:** github.com/Kaizenventures/givezy
- **Admin:** https://givezy.in/admin/login
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
