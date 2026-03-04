# Givezy — Deployment Guide

## Cheapest Setup: $4/mo DigitalOcean Droplet

### 1. Create Droplet
- Go to cloud.digitalocean.com
- Create Droplet → Bangalore datacenter
- Choose: **$4/mo** (512 MB RAM, 10 GB disk) — or $6/mo for 1 GB
- Image: Ubuntu 22.04
- Add your SSH key

### 2. Point Domain
- Buy `givezy.in` from any registrar
- Add an A record: `givezy.in → <droplet-ip>`
- Add an A record: `www.givezy.in → <droplet-ip>`

### 3. Setup Server
```bash
ssh root@<droplet-ip>

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repo
git clone https://github.com/Kaizenventures/givezy.git
cd givezy

# Create env file
cat > .env << 'EOF'
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://givezy.in
ADMIN_EMAIL=vipin@givezy.in
ADMIN_PASSWORD=<your-secure-password>
DATABASE_URL=file:./data/givezy.db
EOF

# Start everything
docker compose up -d --build

# Seed admin user (first time only)
docker compose exec app npx tsx src/lib/seed.ts
```

### 4. That's it!
- Site: https://givezy.in
- Admin: https://givezy.in/admin/login
- Caddy auto-provisions SSL via Let's Encrypt

## Maintenance

```bash
# View logs
docker compose logs -f app

# Update after code changes
git pull && docker compose up -d --build

# Export donations CSV
# Via admin panel, or: curl -H "Cookie: ..." https://givezy.in/api/admin/export

# Backup database
docker compose exec app cp data/givezy.db /tmp/backup.db
docker cp givezy-app-1:/tmp/backup.db ./backup-$(date +%F).db
```

## Cost Breakdown
| Item | Cost |
|------|------|
| DigitalOcean droplet (Bangalore) | $4/mo |
| givezy.in domain | ~$7/yr (~$0.60/mo) |
| SSL (Let's Encrypt) | Free |
| **Total** | **~$4.60/mo** |
