#!/bin/bash

# BMSTROY Deploy Script for Ubuntu/Debian

set -e

echo "=== Обновление системы ==="
apt update

echo "=== Установка Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git nginx

echo "=== Установка PM2 ==="
npm install -g pm2

echo "=== Клонирование проекта ==="
mkdir -p /var/www
cd /var/www
rm -rf bmstroy
git clone https://github.com/meloch287/BMSTROY.git bmstroy
cd bmstroy

echo "=== Установка зависимостей ==="
npm install

echo "=== Сборка проекта ==="
npm run build

echo "=== Запуск через PM2 ==="
pm2 delete bmstroy 2>/dev/null || true
pm2 start npm --name "bmstroy" -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo "=== Настройка Nginx ==="
cat > /etc/nginx/sites-available/bmstroy << 'EOF'
server {
    listen 80;
    server_name 89.23.102.34;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/bmstroy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
systemctl enable nginx

echo ""
echo "=== ГОТОВО! ==="
echo "Сайт доступен: http://89.23.102.34"
echo ""
pm2 status
