#!/bin/bash

# MySQL Backup Monitoring Script
# Monitors CronJob status, validates backups, checks storage, and sends alerts
# Usage: ./monitor-backups.sh [OPTIONS]

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
GOOGLE_DRIVE_FOLDER_ID="${GOOGLE_DRIVE_FOLDER_ID}"
CRONJOB_NAME="mysql-backup"
NAMESPACE="default"
MAX_STORAGE_GB=15
ALERT_WEBHOOK_URL="${ALERT_WEBHOOK_URL}"
ALERT_EMAIL="${ALERT_EMAIL}"
VERBOSE=false

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Status tracking
BACKUP_STATUS="OK"
STORAGE_STATUS="OK"
CRONJOB_STATUS="OK"
ALERT_MESSAGES=()

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $@"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $@"
    BACKUP_STATUS="WARNING"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@"
    BACKUP_STATUS="FAILED"
}

log_debug() {
    if [ "$VERBOSE" == "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $@"
    fi
}

# Display usage
usage() {
    cat <<EOF
${BLUE}MySQL Backup Monitoring Script${NC}

Usage: ./monitor-backups.sh [OPTIONS]

Options:
  --check-cronjob       Check CronJob status
  --check-storage       Check storage capacity
  --check-latest        Check if latest backup exists
  --validate-backup     Validate latest backup integrity
  --all                 Run all checks (default)
  --webhook <url>       Send alerts to webhook URL
  --email <addr>        Send alerts via email
  --verbose             Enable verbose output
  --help                Display this help message

Environment Variables:
  BACKUP_DIR            Local backup directory (default: /backup)
  GOOGLE_DRIVE_FOLDER_ID Google Drive folder ID
  ALERT_WEBHOOK_URL     Slack/Teams webhook URL for alerts
  ALERT_EMAIL           Email address for alerts

Examples:
  ./monitor-backups.sh --all
  ./monitor-backups.sh --check-cronjob --check-storage
  ./monitor-backups.sh --all --webhook https://hooks.slack.com/...

EOF
    exit 0
}

# Parse arguments
CHECK_CRONJOB=true
CHECK_STORAGE=true
CHECK_LATEST=true
CHECK_VALIDATE=true

while [ $# -gt 0 ]; do
    case "$1" in
        --check-cronjob)
            CHECK_CRONJOB=true
            CHECK_STORAGE=false
            CHECK_LATEST=false
            CHECK_VALIDATE=false
            shift
            ;;
        --check-storage)
            CHECK_STORAGE=true
            CHECK_CRONJOB=false
            CHECK_LATEST=false
            CHECK_VALIDATE=false
            shift
            ;;
        --check-latest)
            CHECK_LATEST=true
            CHECK_CRONJOB=false
            CHECK_STORAGE=false
            CHECK_VALIDATE=false
            shift
            ;;
        --validate-backup)
            CHECK_VALIDATE=true
            CHECK_CRONJOB=false
            CHECK_STORAGE=false
            CHECK_LATEST=false
            shift
            ;;
        --all)
            CHECK_CRONJOB=true
            CHECK_STORAGE=true
            CHECK_LATEST=true
            CHECK_VALIDATE=true
            shift
            ;;
        --webhook)
            ALERT_WEBHOOK_URL="$2"
            shift 2
            ;;
        --email)
            ALERT_EMAIL="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Send alert via webhook (Slack/Teams)
send_webhook_alert() {
    local message=$1
    local severity=$2
    
    if [ -z "$ALERT_WEBHOOK_URL" ]; then
        return 0
    fi
    
    # Determine color based on severity
    local color="good"
    if [ "$severity" == "warning" ]; then
        color="warning"
    elif [ "$severity" == "error" ]; then
        color="danger"
    fi
    
    # Create Slack message payload
    local payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "$color",
      "title": "MMS Database Backup Alert",
      "text": "$message",
      "fields": [
        {
          "title": "Severity",
          "value": "$severity",
          "short": true
        },
        {
          "title": "Timestamp",
          "value": "$(date)",
          "short": true
        }
      ]
    }
  ]
}
EOF
)
    
    log_debug "Sending webhook alert: $message"
    curl -X POST -H 'Content-type: application/json' \
        --data "$payload" \
        "$ALERT_WEBHOOK_URL" 2>/dev/null || log_warn "Failed to send webhook alert"
}

# Send alert via email
send_email_alert() {
    local message=$1
    local subject=$2
    
    if [ -z "$ALERT_EMAIL" ] || ! command -v mail &> /dev/null; then
        return 0
    fi
    
    log_debug "Sending email alert to $ALERT_EMAIL: $subject"
    echo "$message" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || log_warn "Failed to send email alert"
}

# Check CronJob status
check_cronjob_status() {
    log_info ""
    log_info "=== Checking CronJob Status ==="
    
    if ! command -v kubectl &> /dev/null; then
        log_warn "kubectl not found - skipping CronJob status check"
        return 1
    fi
    
    # Check if CronJob exists
    if ! kubectl get cronjob "$CRONJOB_NAME" -n "$NAMESPACE" &>/dev/null; then
        log_error "CronJob '$CRONJOB_NAME' not found"
        ALERT_MESSAGES+=("CronJob '$CRONJOB_NAME' not found in namespace '$NAMESPACE'")
        return 1
    fi
    
    # Get CronJob details
    local suspend_status=$(kubectl get cronjob "$CRONJOB_NAME" -n "$NAMESPACE" -o jsonpath='{.spec.suspend}' 2>/dev/null || echo "false")
    local last_success_time=$(kubectl get cronjob "$CRONJOB_NAME" -n "$NAMESPACE" -o jsonpath='{.status.lastSuccessfulTime}' 2>/dev/null || echo "Never")
    local last_schedule_time=$(kubectl get cronjob "$CRONJOB_NAME" -n "$NAMESPACE" -o jsonpath='{.status.lastScheduleTime}' 2>/dev/null || echo "Never")
    
    log_info "CronJob: $CRONJOB_NAME"
    log_info "Suspended: $suspend_status"
    log_info "Last Success: $last_success_time"
    log_info "Last Schedule: $last_schedule_time"
    
    # Check if suspended
    if [ "$suspend_status" == "true" ]; then
        log_warn "CronJob is SUSPENDED - backups are not running!"
        ALERT_MESSAGES+=("CronJob is suspended")
        return 1
    fi
    
    # Check last backup time
    if [ "$last_success_time" == "Never" ]; then
        log_error "No successful backup runs recorded"
        ALERT_MESSAGES+=("No successful backup runs recorded")
        return 1
    fi
    
    # Calculate time since last backup
    local last_backup_epoch=$(date -d "$last_success_time" +%s 2>/dev/null || echo "0")
    local now_epoch=$(date +%s)
    local hours_since_backup=$(( (now_epoch - last_backup_epoch) / 3600 ))
    
    log_info "Hours since last successful backup: $hours_since_backup"
    
    # Alert if backup is older than 12 hours (should run every 6 hours)
    if [ "$hours_since_backup" -gt 12 ]; then
        log_warn "Last backup is older than 12 hours!"
        ALERT_MESSAGES+=("Last backup is $hours_since_backup hours old (expected every 6 hours)")
        return 1
    fi
    
    # Check recent job status
    local recent_jobs=$(kubectl get jobs -n "$NAMESPACE" -l app=mysql-backup --sort-by=.metadata.creationTimestamp 2>/dev/null | tail -5)
    log_debug "Recent backup jobs:"
    log_debug "$recent_jobs"
    
    local failed_jobs=$(kubectl get jobs -n "$NAMESPACE" -l app=mysql-backup --field-selector status.failed=1 2>/dev/null | wc -l)
    if [ "$failed_jobs" -gt 1 ]; then
        log_warn "Found $((failed_jobs - 1)) failed backup jobs"
        ALERT_MESSAGES+=("Found $((failed_jobs - 1)) failed backup jobs")
        return 1
    fi
    
    log_info "✓ CronJob status is healthy"
    return 0
}

# Check storage capacity
check_storage_capacity() {
    log_info ""
    log_info "=== Checking Storage Capacity ==="
    
    local local_size=0
    local gdrive_size=0
    
    # Calculate local size
    if [ -d "$BACKUP_DIR" ]; then
        local_size=$(du -sb "$BACKUP_DIR" 2>/dev/null | awk '{print $1}' || echo "0")
    fi
    
    # Calculate Google Drive size
    if [ -n "$GOOGLE_DRIVE_FOLDER_ID" ] && command -v rclone &> /dev/null; then
        gdrive_size=$(rclone size "gdrive:${GOOGLE_DRIVE_FOLDER_ID}" --json 2>/dev/null | grep -o '"Bytes":[0-9]*' | cut -d':' -f2 || echo "0")
    fi
    
    local local_gb=$(awk "BEGIN {printf \"%.2f\", $local_size / 1024 / 1024 / 1024}")
    local gdrive_gb=$(awk "BEGIN {printf \"%.2f\", $gdrive_size / 1024 / 1024 / 1024}")
    local total_gb=$(awk "BEGIN {printf \"%.2f\", ($local_size + $gdrive_size) / 1024 / 1024 / 1024}")
    
    log_info "Local Storage:        $local_gb GiB / $MAX_STORAGE_GB GiB"
    log_info "Google Drive:         $gdrive_gb GiB / $MAX_STORAGE_GB GiB"
    log_info "Total Usage:          $total_gb GiB / $((MAX_STORAGE_GB * 2)) GiB (combined)"
    
    # Check local capacity
    if (( $(echo "$local_gb > $MAX_STORAGE_GB" | bc -l) )); then
        log_error "Local storage EXCEEDS $MAX_STORAGE_GB GiB limit!"
        ALERT_MESSAGES+=("Local storage exceeds $MAX_STORAGE_GB GiB limit: $local_gb GiB used")
        STORAGE_STATUS="FAILED"
        return 1
    elif (( $(echo "$local_gb > $((MAX_STORAGE_GB - 2))" | bc -l) )); then
        log_warn "Local storage is >$((MAX_STORAGE_GB - 2)) GiB (approaching limit)"
        ALERT_MESSAGES+=("Local storage approaching limit: $local_gb GiB used")
        STORAGE_STATUS="WARNING"
        return 1
    fi
    
    # Check Google Drive capacity
    if (( $(echo "$gdrive_gb > $MAX_STORAGE_GB" | bc -l) )); then
        log_error "Google Drive storage EXCEEDS $MAX_STORAGE_GB GiB limit!"
        ALERT_MESSAGES+=("Google Drive storage exceeds $MAX_STORAGE_GB GiB limit: $gdrive_gb GiB used")
        STORAGE_STATUS="FAILED"
        return 1
    elif (( $(echo "$gdrive_gb > $((MAX_STORAGE_GB - 2))" | bc -l) )); then
        log_warn "Google Drive storage is >$((MAX_STORAGE_GB - 2)) GiB (approaching limit)"
        ALERT_MESSAGES+=("Google Drive storage approaching limit: $gdrive_gb GiB used")
        STORAGE_STATUS="WARNING"
        return 1
    fi
    
    log_info "✓ Storage capacity is healthy"
    return 0
}

# Check if latest backup exists
check_latest_backup() {
    log_info ""
    log_info "=== Checking Latest Backup ==="
    
    local latest_backup=$(ls -1t "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No backup files found in $BACKUP_DIR"
        ALERT_MESSAGES+=("No backup files found in $BACKUP_DIR")
        return 1
    fi
    
    local backup_name=$(basename "$latest_backup")
    local backup_size=$(du -sh "$latest_backup" | awk '{print $1}')
    local backup_age_seconds=$(($(date +%s) - $(stat -f%m "$latest_backup" 2>/dev/null || stat -c%Y "$latest_backup")))
    local backup_age_hours=$((backup_age_seconds / 3600))
    local backup_age_minutes=$((backup_age_seconds / 60))
    
    log_info "Latest backup: $backup_name"
    log_info "Size: $backup_size"
    log_info "Age: $backup_age_hours hours $((backup_age_minutes % 60)) minutes ago"
    
    # Alert if backup is older than 12 hours
    if [ "$backup_age_hours" -gt 12 ]; then
        log_warn "Latest backup is older than 12 hours!"
        ALERT_MESSAGES+=("Latest backup is $backup_age_hours hours old")
        return 1
    fi
    
    log_info "✓ Latest backup exists and is current"
    return 0
}

# Validate backup integrity
validate_backup_integrity() {
    log_info ""
    log_info "=== Validating Backup Integrity ==="
    
    local latest_backup=$(ls -1t "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | head -1)
    
    if [ -z "$latest_backup" ]; then
        log_error "No backup files found in $BACKUP_DIR"
        ALERT_MESSAGES+=("No backup files found for validation")
        return 1
    fi
    
    local backup_name=$(basename "$latest_backup")
    log_info "Validating backup: $backup_name"
    
    # Test gzip integrity
    log_debug "Testing gzip integrity..."
    if ! gunzip --test "$latest_backup" 2>/dev/null; then
        log_error "Backup file is corrupted!"
        ALERT_MESSAGES+=("Backup file is corrupted: $backup_name")
        return 1
    fi
    log_info "✓ Gzip integrity check passed"
    
    # Check for SQL content
    log_debug "Checking SQL content..."
    if ! gunzip -c "$latest_backup" 2>/dev/null | head -100 | grep -q "CREATE DATABASE"; then
        log_warn "Could not find CREATE DATABASE in backup (may be empty or corrupted)"
        ALERT_MESSAGES+=("Backup may not contain valid SQL: $backup_name")
        return 1
    fi
    log_info "✓ Backup contains valid SQL"
    
    # Count databases in backup
    local db_count=$(gunzip -c "$latest_backup" 2>/dev/null | grep -c "CREATE DATABASE" || echo "0")
    log_info "Databases in backup: $db_count"
    
    if [ "$db_count" -lt 5 ]; then
        log_warn "Backup contains only $db_count databases (expected 7)"
        ALERT_MESSAGES+=("Backup incomplete: only $db_count databases found")
        return 1
    fi
    
    log_info "✓ Backup integrity validation passed"
    return 0
}

# Generate summary report
generate_report() {
    log_info ""
    log_info "================================"
    log_info "Backup Monitoring Report"
    log_info "================================"
    log_info "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "Overall Status: $BACKUP_STATUS"
    log_info ""
    
    if [ ${#ALERT_MESSAGES[@]} -gt 0 ]; then
        log_warn "Issues Found:"
        for msg in "${ALERT_MESSAGES[@]}"; do
            log_warn "  - $msg"
        done
    else
        log_info "✓ All checks passed"
    fi
}

# Main execution
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   MySQL Backup Monitoring Script       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Run checks
if [ "$CHECK_CRONJOB" == "true" ]; then
    check_cronjob_status || true
fi

if [ "$CHECK_STORAGE" == "true" ]; then
    check_storage_capacity || true
fi

if [ "$CHECK_LATEST" == "true" ]; then
    check_latest_backup || true
fi

if [ "$CHECK_VALIDATE" == "true" ]; then
    validate_backup_integrity || true
fi

# Generate report
generate_report

# Send alerts if issues found
if [ "$BACKUP_STATUS" != "OK" ] && [ ${#ALERT_MESSAGES[@]} -gt 0 ]; then
    local alert_msg=$(printf '%s\n' "${ALERT_MESSAGES[@]}" | head -5 | paste -sd ',' -)
    send_webhook_alert "$alert_msg" "error"
    send_email_alert "Backup monitoring issues:\n$alert_msg" "MMS Database Backup Alert"
fi

# Exit with appropriate code
if [ "$BACKUP_STATUS" == "FAILED" ]; then
    exit 1
elif [ "$BACKUP_STATUS" == "WARNING" ]; then
    exit 0  # Exit 0 so it doesn't break pipelines, but alerts were sent
else
    exit 0
fi
