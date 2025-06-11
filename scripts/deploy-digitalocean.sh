
#!/bin/bash

# DigitalOcean Deployment Script
# Requires: doctl CLI installed and configured

set -e

# Configuration
DROPLET_NAME="trading-bot-server"
REGION="fra1"
SIZE="s-1vcpu-2gb"
IMAGE="docker-20-04"
SSH_KEY_NAME="trading-bot-key"
DOMAIN="your-domain.com"

echo "🚀 Starting DigitalOcean deployment..."

# Check if droplet exists
if doctl compute droplet get $DROPLET_NAME > /dev/null 2>&1; then
    echo "✅ Droplet $DROPLET_NAME already exists"
    DROPLET_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)
else
    echo "📦 Creating new droplet..."
    doctl compute droplet create $DROPLET_NAME \
        --region $REGION \
        --size $SIZE \
        --image $IMAGE \
        --ssh-keys $(doctl compute ssh-key get $SSH_KEY_NAME --format ID --no-header) \
        --wait

    DROPLET_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)
    echo "✅ Droplet created with IP: $DROPLET_IP"
    
    # Wait for SSH to be ready
    echo "⏳ Waiting for SSH connection..."
    sleep 60
fi

echo "🔧 Setting up server..."

# Create deployment directory
ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
    mkdir -p /opt/trading-bot
    mkdir -p /opt/trading-bot/logs
    mkdir -p /opt/trading-bot/backups
    mkdir -p /opt/trading-bot/monitoring
EOF

# Copy files
echo "📁 Copying project files..."
scp -r . root@$DROPLET_IP:/opt/trading-bot/

# Install and run
ssh root@$DROPLET_IP << 'EOF'
    cd /opt/trading-bot
    
    # Install Docker if not exists
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose if not exists
    if ! command -v docker-compose &> /dev/null; then
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Setup environment
    cp .env.production .env
    
    # Setup firewall
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 3000
    ufw allow 3001
    ufw allow 9090
    ufw --force enable
    
    # Build and start
    docker-compose down || true
    docker-compose build
    docker-compose up -d
    
    # Setup backup cron
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/trading-bot/scripts/backup.sh >> /opt/trading-bot/backup.log 2>&1") | crontab -
    
    echo "✅ Deployment completed!"
    echo "🌐 Access your trading bot at: http://$DROPLET_IP:3000"
    echo "📊 Grafana dashboard at: http://$DROPLET_IP:3001 (admin/trading123!)"
EOF

echo "🎉 DigitalOcean deployment finished!"
echo "🌐 Trading Bot: http://$DROPLET_IP:3000"
echo "📊 Grafana: http://$DROPLET_IP:3001"
echo "🔧 Prometheus: http://$DROPLET_IP:9090"

# Optional: Setup domain
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo "🌍 Setting up domain $DOMAIN..."
    doctl compute domain records create $DOMAIN \
        --record-type A \
        --record-name @ \
        --record-data $DROPLET_IP \
        --record-ttl 300
fi
