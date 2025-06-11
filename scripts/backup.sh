
#!/bin/bash

# Backup Script for Trading Bot Data

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="trading-bot-backup-$DATE"
RETENTION_DAYS=30

echo "📦 Starting backup: $BACKUP_NAME"

# Create backup directory
mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Backup logs
if [ -d "/var/log/trading-bot" ]; then
    echo "📋 Backing up logs..."
    cp -r /var/log/trading-bot $BACKUP_DIR/$BACKUP_NAME/logs
fi

# Backup application data (if any persistent data exists)
if [ -d "/app/data" ]; then
    echo "💾 Backing up application data..."
    cp -r /app/data $BACKUP_DIR/$BACKUP_NAME/data
fi

# Export system info
echo "🔧 Exporting system information..."
{
    echo "=== Backup Information ==="
    echo "Date: $(date)"
    echo "Hostname: $(hostname)"
    echo "Docker version: $(docker --version)"
    echo ""
    echo "=== Running containers ==="
    docker ps
    echo ""
    echo "=== Container logs ==="
    docker-compose logs --tail=100
} > $BACKUP_DIR/$BACKUP_NAME/system-info.txt

# Create archive
echo "🗜️ Creating backup archive..."
cd $BACKUP_DIR
tar -czf $BACKUP_NAME.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME

# Cleanup old backups
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "trading-bot-backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Optional: Upload to cloud storage
# Uncomment and configure for your cloud provider
# aws s3 cp $BACKUP_DIR/$BACKUP_NAME.tar.gz s3://your-backup-bucket/
# gsutil cp $BACKUP_DIR/$BACKUP_NAME.tar.gz gs://your-backup-bucket/
