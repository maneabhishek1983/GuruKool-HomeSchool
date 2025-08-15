#!/bin/bash

# Rollback Script for GuruKool HomeSchool
set -e

echo "🔄 GuruKool HomeSchool Rollback"
echo "==============================="

BACKUP_DIR="./backups"
LOG_FILE="./deploy/rollback.log"

# Create log file
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# List available backups
log "Available backups:"
ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || {
    log "ERROR: No backups found in $BACKUP_DIR"
    exit 1
}

# Get the latest backup or use specified backup
BACKUP_FILE=${1:-$(ls -t "$BACKUP_DIR"/*.tar.gz | head -n1)}

if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

log "Rolling back to: $BACKUP_FILE"

# Stop current services
log "Stopping current services..."
docker-compose down

# Create current state backup before rollback
log "Creating pre-rollback backup..."
CURRENT_BACKUP="$BACKUP_DIR/pre-rollback-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$CURRENT_BACKUP" --exclude=node_modules --exclude=.next --exclude=.git .
log "Current state backed up to: $CURRENT_BACKUP"

# Restore from backup
log "Restoring from backup..."
tar -xzf "$BACKUP_FILE" --exclude=node_modules --exclude=.next

# Rebuild and restart
log "Rebuilding and restarting services..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services
log "Waiting for services to start..."
sleep 30

# Health check
log "Performing health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Rollback completed successfully"
    log "Application is healthy and running"
else
    log "❌ Rollback health check failed"
    exit 1
fi

log "🎉 Rollback completed successfully!"
log "Rollback log saved to: $LOG_FILE"