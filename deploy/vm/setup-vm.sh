#!/usr/bin/env bash
# Runs ON the VM (Debian 12). Installs Docker, adds swap, loads the image, writes secrets once, starts the stack.
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -f /swapfile ]; then sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab; fi
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sudo sh; sudo usermod -aG docker "$USER"; fi
sudo docker load -i stepwise-image.tar.gz && rm -f stepwise-image.tar.gz
if [ ! -f .env ]; then
  IP=$(curl -s -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
  cat > .env <<ENV
DOMAIN=${DOMAIN:-${IP//./-}.sslip.io}
DB_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
ENV
  chmod 600 .env
fi
mkdir -p backups
sudo docker compose up -d
# nightly database backup, keep 14 days
( sudo crontab -l 2>/dev/null | grep -v stepwise-backup; echo "30 3 * * * cd $PWD && docker compose exec -T db pg_dump -U stepwise stepwise | gzip > backups/stepwise-\$(date +\%F).sql.gz && find backups -name '*.sql.gz' -mtime +14 -delete # stepwise-backup" ) | sudo crontab -
grep DOMAIN .env
