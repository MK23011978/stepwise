#!/usr/bin/env bash
# Stepwise — Google Cloud e2-micro (Always Free) sunucu kurulumu.
# Kullanım (VM içinde, proje klasöründe):  sudo bash deploy/setup.sh alanadi.com
# Alan adınız yoksa boş bırakın: sunucunun IP'si ile ücretsiz <IP>.sslip.io adresi kullanılır.
set -euo pipefail
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  IP="$(curl -s -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)"
  DOMAIN="${IP//./-}.sslip.io"
fi
echo "==> Alan adı: $DOMAIN"

echo "==> 1 GB swap (e2-micro'nun belleği az)"
if [ ! -f /swapfile ]; then fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && echo '/swapfile none swap sw 0 0' >> /etc/fstab; fi

echo "==> Node.js 20"
if ! command -v node >/dev/null; then curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs; fi

echo "==> Caddy (otomatik HTTPS)"
if ! command -v caddy >/dev/null; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get install -y caddy
fi
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
  encode gzip
  reverse_proxy 127.0.0.1:3000
}
CADDY
systemctl reload caddy || systemctl restart caddy

echo "==> Uygulama kullanıcısı ve ayar dosyası"
id stepwise >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin stepwise
mkdir -p "$APP_DIR/data" && chown -R stepwise:stepwise "$APP_DIR/data"
if [ ! -f /etc/stepwise.env ]; then
  cat > /etc/stepwise.env <<ENV
PORT=3000
COOKIE_SECURE=true
# Stripe anahtarlarını buraya ekleyin (boş kalırsa demo modu):
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
ENV
  chmod 600 /etc/stepwise.env
fi

echo "==> systemd servisi"
cat > /etc/systemd/system/stepwise.service <<UNIT
[Unit]
Description=Stepwise GCSE
After=network.target

[Service]
User=stepwise
WorkingDirectory=$APP_DIR
EnvironmentFile=/etc/stepwise.env
ExecStart=$(command -v node) server.js
Restart=always
MemoryMax=600M

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload && systemctl enable --now stepwise && systemctl restart stepwise

echo "==> Günlük veri yedeği (son 14 gün, data/backups)"
cat > /etc/cron.daily/stepwise-backup <<CRON
#!/bin/sh
mkdir -p $APP_DIR/data/backups
cp $APP_DIR/data/db.json $APP_DIR/data/backups/db-\$(date +%F).json 2>/dev/null
find $APP_DIR/data/backups -name 'db-*.json' -mtime +14 -delete
CRON
chmod +x /etc/cron.daily/stepwise-backup

echo
echo "✅ Hazır: https://$DOMAIN"
echo "   Admin oluşturmak için: cd $APP_DIR && sudo -u stepwise npm run create-admin -- --email siz@ornek.com --name \"Adınız\" --password \"guclu-bir-sifre\""
