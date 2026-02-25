# NGINX and SSL Setup Instructions

## Prerequisites

- A domain name pointing to your server's IP address
- Access to the server with sudo privileges
- Port 80 and 443 available on your server

## Step 1: Install Certbot

```bash
# Install EPEL repository if not already installed
sudo yum install epel-release

# Install Certbot
sudo yum install certbot
```

## Step 2: Obtain SSL Certificate

```bash
# Stop any services using port 80
sudo docker-compose down

# Get the certificate (replace with your domain)
sudo certbot certonly --standalone -d offers.handsomehomebuyer.com

# The certificates will be saved in:
# /etc/letsencrypt/live/offers.handsomehomebuyer.com/fullchain.pem
# /etc/letsencrypt/live/offers.handsomehomebuyer.com/privkey.pem
```

## Step 3: Set Up NGINX Directory Structure

```bash
# Create nginx configuration directories
mkdir -p nginx/conf.d nginx/ssl

# Copy SSL certificates
sudo cp /etc/letsencrypt/live/offers.handsomehomebuyer.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/offers.handsomehomebuyer.com/privkey.pem nginx/ssl/

# Set proper permissions
sudo chmod 644 nginx/ssl/*.pem
```

## Step 4: Create NGINX Configuration

Create `nginx/conf.d/default.conf` with the following content:

```nginx
server {
    listen 80;
    server_name offers.handsomehomebuyer.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name offers.handsomehomebuyer.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Proxy settings
    location /api {
        proxy_pass http://app:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location / {
        proxy_pass http://app:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Step 5: Update Docker Compose Configuration

Add the nginx service to your `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/conf.d:/etc/nginx/conf.d
    - ./nginx/ssl:/etc/nginx/ssl
  depends_on:
    - app
  networks:
    - app-network
```

## Step 6: Start the Services

```bash
# Start all services
sudo docker-compose up -d

# Check status
sudo docker-compose ps

# Check logs if needed
sudo docker-compose logs nginx
```

## SSL Certificate Renewal

Certbot creates a renewal service automatically. You can:

- Test renewal: `sudo certbot renew --dry-run`
- Manual renewal: `sudo certbot renew`
- Enable automatic renewal: `sudo systemctl start certbot-renew.timer`

Remember to copy the renewed certificates to your nginx/ssl directory and restart nginx when certificates are renewed:

```bash
# Script for updating certificates (save as update-certs.sh)
#!/bin/bash
sudo cp /etc/letsencrypt/live/offers.handsomehomebuyer.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/offers.handsomehomebuyer.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
sudo docker-compose restart nginx
```

## Troubleshooting

### Common Issues

1. Certificate not found:

   ```bash
   # Check if certificates exist
   ls -la nginx/ssl/

   # Check nginx logs
   sudo docker-compose logs nginx
   ```

2. Permission issues:

   ```bash
   # Fix permissions
   sudo chmod 644 nginx/ssl/*.pem
   sudo chown $(whoami):$(whoami) nginx/ssl/*.pem
   ```

3. Port conflicts:

   ```bash
   # Check if ports are in use
   sudo netstat -tuln | grep -E ':(80|443)'

   # Stop conflicting services
   sudo systemctl stop nginx  # if system nginx is running
   ```

### Validation

- Test HTTPS: Visit https://offers.handsomehomebuyer.com
- Check certificate: Visit https://www.ssllabs.com/ssltest/
- Test HTTP redirect: Visit http://offers.handsomehomebuyer.com (should redirect to HTTPS)

## Postgres Backup & Restore (Docker Volume)

### Backup the `hhboffers` database

From the server (in `~/HHBOffers`), create a logical SQL backup using `pg_dump`:

```bash
docker exec -t hhboffers-postgres-1 \
  pg_dump -U dbuser -d hhboffers \
  > hhboffers-$(date +%Y%m%d-%H%M%S).sql
```

Optional: compress the dump:

```bash
gzip hhboffers-20260225-111400.sql
```

Adjust the filename/date as needed.

### Download backup to your machine

From your local machine (PowerShell on Windows):

```powershell
scp root@147.93.144.178:/root/HHBOffers/hhboffers-20260225-111400.sql.gz .
```

### Restore from a backup

On the server (replace with your filename):

```bash
gunzip hhboffers-20260225-111400.sql.gz  # if compressed

cat hhboffers-20260225-111400.sql | \
  docker exec -i hhboffers-postgres-1 \
  psql -U dbuser -d hhboffers
```

### (Optional) Snapshot the raw Postgres volume

If you ever need a raw volume snapshot instead of a logical SQL dump:

```bash
docker run --rm \
  --volumes-from hhboffers-postgres-1 \
  -v $(pwd):/backup \
  alpine sh -c \
  "cd /var/lib/postgresql && tar czf /backup/postgres-volume-$(date +%Y%m%d-%H%M%S).tar.gz data"
```

Prefer the `pg_dump` backups for portability and easier restores.
