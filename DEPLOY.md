# Guia de Deploy

## Pré-requisitos no servidor

- Node.js 20+
- PostgreSQL 16+
- Nginx
- Certbot (Let's Encrypt)
- Acesso root ou sudo

## Estrutura

```
/var/www/html/mapeamento/   # Código fonte
/etc/nginx/sites-available/mapeamento.cassolsoftware.com.br  # Config nginx
/etc/systemd/system/mapeamento.service                        # Service systemd
```

## 1. Preparar o servidor

```bash
# Instalar dependências
apt update && apt install -y nginx certbot python3-certbot-nginx postgresql

# Configurar PostgreSQL
sudo -u postgres createuser cassol --createdb --pwprompt  # senha: cassol123
sudo -u postgres createdb cassol_mapeamento --owner cassol

# Instalar Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

## 2. Configurar SSL (Nginx + Let's Encrypt)

```bash
# Criar nginx config inicial (só HTTP)
nano /etc/nginx/sites-available/mapeamento.cassolsoftware.com.br

# Configuração mínima:
# server {
#     server_name mapeamento.cassolsoftware.com.br;
#     location / { proxy_pass http://localhost:3002; proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         proxy_cache_bypass $http_upgrade; }
#     listen 80;
# }

ln -s /etc/nginx/sites-available/mapeamento.cassolsoftware.com.br /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Emitir SSL
certbot --nginx -d mapeamento.cassolsoftware.com.br
```

## 3. Enviar código e buildar

```bash
# Na máquina de desenvolvimento
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .env \
  /var/www/html/mapeamento/ root@SEU_SERVIDOR:/var/www/html/mapeamento/

# No servidor
cd /var/www/html/mapeamento
npm install
cp .env.example .env
nano .env  # Preencher DATABASE_URL, AUTH_SECRET, AUTH_URL
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run build
```

## 4. Service systemd

Criar `/etc/systemd/system/mapeamento.service`:

```ini
[Unit]
Description=Mapeamento Next.js
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/html/mapeamento
ExecStart=/usr/bin/npx next start -p 3002
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=AUTH_URL=https://mapeamento.cassolsoftware.com.br
Environment=AUTH_SECRET=<seu-segredo-aqui>
Environment=PORT=3002

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now mapeamento
systemctl status mapeamento  # Verificar se está rodando
```

## 5. Atualizar código

```bash
# Na máquina de desenvolvimento
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .env \
  /var/www/html/mapeamento/ root@SEU_SERVIDOR:/var/www/html/mapeamento/

# No servidor
cd /var/www/html/mapeamento
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
systemctl restart mapeamento
```

## 6. Verificar

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3002/login  # 200
curl -s -o /dev/null -w "%{http_code}\n" https://mapeamento.cassolsoftware.com.br/login  # 200

# Ver logs
journalctl -u mapeamento -n 50 --no-pager
tail -f /var/www/html/mapeamento/.next/logs/app.log 2>/dev/null
```

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| `UntrustedHost` | `AUTH_URL` não configurada | Adicionar `Environment=AUTH_URL=...` no service e reiniciar |
| `MissingSecret` | `AUTH_SECRET` não configurada | Adicionar `Environment=AUTH_SECRET=...` no service e reiniciar |
| `MissingCSRF` | Cookie de sessão expirado | Limpar cookies do navegador |
| 404 pós-login | Redirecionamento para rota inexistente | Verificar `router.push()` no LoginForm |
| `ECONNREFUSED` PostgreSQL | Banco não está rodando | `systemctl restart postgresql` |
| Porta já em uso | Outro processo na 3002 | `lsof -i :3002` e matar processo |
