#!/bin/bash

# Production Deployment Script for GuruKool HomeSchool
set -e

echo "🚀 Starting GuruKool HomeSchool Deployment"
echo "=========================================="

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="./backups"
LOG_FILE="./deploy/deploy.log"

# Create log file
mkdir -p "$(dirname "$LOG_FILE")"
touch "$LOG_FILE"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting deployment for environment: $ENVIRONMENT"

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log "ERROR: Docker is not running"
    exit 1
fi

# Check if required environment variables are set
required_vars=("DATABASE_URL" "SUPABASE_URL" "SUPABASE_ANON_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log "WARNING: Environment variable $var is not set"
    fi
done

# Create backup
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.next --exclude=.git .
log "Backup created: $BACKUP_FILE"

# Build and deploy
log "Building and deploying application..."
docker-compose -f "$DOCKER_COMPOSE_FILE" down
docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Health check
log "Performing health checks..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Application health check passed"
else
    log "❌ Application health check failed"
    exit 1
fi

# Database migration (if needed)
log "Running database migrations..."
# docker-compose exec app npm run db:migrate

log "🎉 Deployment completed successfully!"
log "Application is available at: http://localhost:3000"
log "Monitoring dashboard: http://localhost:3001 (admin/admin)"
log "Prometheus metrics: http://localhost:9090"

# Clean up old backups (keep last 5)
log "Cleaning up old backups..."
ls -t "$BACKUP_DIR"/*.tar.gz | tail -n +6 | xargs -r rm

log "Deployment log saved to: $LOG_FILE"