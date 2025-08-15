#!/bin/bash

# Health Check Script for GuruKool HomeSchool
set -e

echo "🏥 GuruKool HomeSchool Health Check"
echo "==================================="

LOG_FILE="./deploy/health-check.log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check application health
log "Checking application health..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log "✅ Application: Healthy"
    APP_HEALTHY=true
else
    log "❌ Application: Unhealthy"
    APP_HEALTHY=false
fi

# Check database connectivity
log "Checking database connectivity..."
if docker-compose exec -T postgres pg_isready > /dev/null 2>&1; then
    log "✅ Database: Connected"
    DB_HEALTHY=true
else
    log "❌ Database: Connection failed"
    DB_HEALTHY=false
fi

# Check Redis
log "Checking Redis cache..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    log "✅ Redis: Connected"
    REDIS_HEALTHY=true
else
    log "❌ Redis: Connection failed"
    REDIS_HEALTHY=false
fi

# Check disk space
log "Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    log "✅ Disk Space: ${DISK_USAGE}% used"
    DISK_HEALTHY=true
else
    log "⚠️ Disk Space: ${DISK_USAGE}% used (Warning: >90%)"
    DISK_HEALTHY=false
fi

# Check memory usage
log "Checking memory usage..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 90 ]; then
    log "✅ Memory: ${MEMORY_USAGE}% used"
    MEMORY_HEALTHY=true
else
    log "⚠️ Memory: ${MEMORY_USAGE}% used (Warning: >90%)"
    MEMORY_HEALTHY=false
fi

# Overall health assessment
log "Overall Health Assessment:"
if [ "$APP_HEALTHY" = true ] && [ "$DB_HEALTHY" = true ] && [ "$REDIS_HEALTHY" = true ] && [ "$DISK_HEALTHY" = true ] && [ "$MEMORY_HEALTHY" = true ]; then
    log "🎉 System Status: HEALTHY"
    exit 0
else
    log "⚠️ System Status: DEGRADED"
    exit 1
fi