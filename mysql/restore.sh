#!/bin/bash

# MySQL Backup Restore Script
# Restores MySQL database from gzipped backups stored locally or on Google Drive
# Usage: ./restore.sh <backup_filename> [--dry-run]
# Examples:
#   ./restore.sh backup-20260506-000000.sql.gz
#   ./restore.sh 20260506-000000
#   ./restore.sh backup-20260506-000000.sql.gz --dry-run

set -e

# Configuration
MYSQL_HOST="${MYSQL_HOST:-mysql}"
MYSQL_ROOT_USER="${MYSQL_ROOT_USER:-root}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}"
BACKUP_DIR="${BACKUP_DIR:-/backup}"
GOOGLE_DRIVE_FOLDER_ID="${GOOGLE_DRIVE_FOLDER_ID}"
DRY_RUN=false
RESTORE_LOG_FILE="${BACKUP_DIR}/restore-$(date +%Y%m%d-%H%M%S).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $@" | tee -a "${RESTORE_LOG_FILE}"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $@" | tee -a "${RESTORE_LOG_FILE}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@" | tee -a "${RESTORE_LOG_FILE}"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $@" | tee -a "${RESTORE_LOG_FILE}"
}

# Display usage information
usage() {
    cat <<EOF
${BLUE}MySQL Backup Restore Utility${NC}

Usage: ./restore.sh <backup_filename> [OPTIONS]

Arguments:
  <backup_filename>     Backup file name or timestamp (e.g., backup-20260506-000000.sql.gz or 20260506-000000)
                        Can be stored locally in ${BACKUP_DIR} or on Google Drive

Options:
  --dry-run             Preview SQL commands without executing restore
  --help                Display this help message

Environment Variables:
  MYSQL_HOST            MySQL server hostname (default: mysql)
  MYSQL_ROOT_USER       MySQL root username (default: root)
  MYSQL_ROOT_PASSWORD   MySQL root password (REQUIRED)
  BACKUP_DIR            Local backup directory (default: /backup)
  GOOGLE_DRIVE_FOLDER_ID Google Drive folder ID for backups
  RCLONE_CONFIG         Path to rclone config (default: /etc/rclone/rclone.conf)

Examples:
  ./restore.sh backup-20260506-000000.sql.gz
  ./restore.sh 20260506-000000 --dry-run
  ./restore.sh backup-latest.sql.gz

Log File: ${RESTORE_LOG_FILE}

EOF
    exit 0
}

# Parse arguments
if [ $# -eq 0 ] || [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    usage
fi

BACKUP_FILENAME="$1"
shift

# Parse options
while [ $# -gt 0 ]; do
    case "$1" in
        --dry-run)
            DRY_RUN=true
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

# Initialize backup directory and log
mkdir -p "${BACKUP_DIR}"

log_info "================================"
log_info "MySQL Backup Restore Started"
log_info "================================"
log_info "Timestamp: $(date)"
log_info "Requested backup: ${BACKUP_FILENAME}"
log_info "MySQL Host: ${MYSQL_HOST}"
log_info "Dry Run: ${DRY_RUN}"
log_info ""

# Validate environment
if [ -z "${MYSQL_ROOT_PASSWORD}" ]; then
    log_error "MYSQL_ROOT_PASSWORD not set in environment"
    exit 1
fi

# Test MySQL connectivity
log_info "Testing MySQL connectivity as root..."
if ! mysql -h "${MYSQL_HOST}" -u "${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" &>/dev/null; then
    log_error "Failed to connect to MySQL at ${MYSQL_HOST} as ${MYSQL_ROOT_USER}"
    exit 1
fi
log_info "✓ MySQL connection successful"
log_info ""

# Normalize backup filename
if [[ ! "$BACKUP_FILENAME" =~ \.sql\.gz$ ]]; then
    # If only timestamp provided, construct filename
    if [[ "$BACKUP_FILENAME" =~ ^[0-9]{8}-[0-9]{6}$ ]]; then
        BACKUP_FILENAME="backup-${BACKUP_FILENAME}.sql.gz"
    else
        # Assume it's a prefix, search for matching file
        SEARCH_PREFIX="backup-${BACKUP_FILENAME}"
        if [ ! -f "${BACKUP_DIR}/${BACKUP_FILENAME}" ]; then
            BACKUP_FILENAME="${SEARCH_PREFIX}.sql.gz"
        fi
    fi
fi

# Check if backup exists locally
LOCAL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

log_info "Looking for backup: ${BACKUP_FILENAME}"

if [ -f "${LOCAL_BACKUP_PATH}" ]; then
    log_info "✓ Found backup locally: ${LOCAL_BACKUP_PATH}"
    BACKUP_SOURCE="local"
else
    log_info "Backup not found locally, checking Google Drive..."
    
    # Try to download from Google Drive if configured
    if [ -z "${GOOGLE_DRIVE_FOLDER_ID}" ]; then
        log_error "Backup not found locally and GOOGLE_DRIVE_FOLDER_ID not configured"
        exit 1
    fi
    
    # Check if rclone is available
    if ! command -v rclone &> /dev/null; then
        log_error "rclone not found. Please install rclone or provide backup file locally."
        exit 1
    fi
    
    log_info "Downloading backup from Google Drive..."
    if rclone copy "gdrive:${GOOGLE_DRIVE_FOLDER_ID}/${BACKUP_FILENAME}" "${BACKUP_DIR}/" --verbose; then
        log_info "✓ Successfully downloaded from Google Drive"
        BACKUP_SOURCE="gdrive"
    else
        log_error "Failed to download backup from Google Drive"
        exit 1
    fi
fi

# Verify backup file exists now
if [ ! -f "${LOCAL_BACKUP_PATH}" ]; then
    log_error "Backup file not found: ${LOCAL_BACKUP_PATH}"
    exit 1
fi

log_info "Backup file: ${LOCAL_BACKUP_PATH}"

# Get file size
BACKUP_SIZE=$(du -sh "${LOCAL_BACKUP_PATH}" | awk '{print $1}')
log_info "Backup size: ${BACKUP_SIZE}"
log_info ""

# Validate backup integrity
log_info "Validating backup integrity..."
if ! gunzip --test "${LOCAL_BACKUP_PATH}" 2>/dev/null; then
    log_error "Backup file is corrupted or invalid gzip format"
    exit 1
fi
log_info "✓ Backup integrity verified"
log_info ""

# Preview backup content (first few lines)
log_info "Backup preview (first 10 lines):"
gunzip -c "${LOCAL_BACKUP_PATH}" 2>/dev/null | head -n 10 | tee -a "${RESTORE_LOG_FILE}"
log_info ""

# Get list of databases in backup
log_info "Analyzing backup structure..."
DATABASES=$(gunzip -c "${LOCAL_BACKUP_PATH}" 2>/dev/null | grep -E "^CREATE DATABASE" | awk '{print $3}' | tr -d '`' | sort -u)
if [ -z "$DATABASES" ]; then
    log_warn "No CREATE DATABASE statements found in backup"
else
    log_info "Databases in backup:"
    echo "$DATABASES" | sed 's/^/  - /' | tee -a "${RESTORE_LOG_FILE}"
fi
log_info ""

# Confirm restore
if [ "$DRY_RUN" == "false" ]; then
    log_warn "⚠️  This will restore all databases from the backup!"
    log_warn "Existing data in these databases WILL BE OVERWRITTEN."
    read -p "Do you want to proceed? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
fi

# Perform restore
if [ "$DRY_RUN" == "true" ]; then
    log_info "DRY-RUN MODE: Previewing SQL commands (not executing)"
    log_info ""
    log_info "SQL Preview (first 100 lines):"
    gunzip -c "${LOCAL_BACKUP_PATH}" 2>/dev/null | head -n 100 | tee -a "${RESTORE_LOG_FILE}"
    log_info ""
    log_info "✓ Dry-run preview complete"
    log_info "To execute the actual restore, run without --dry-run flag"
else
    log_info "Starting database restore..."
    
    # Create temporary SQL file for restore
    TEMP_RESTORE_FILE="/tmp/restore-${TIMESTAMP}.sql"
    gunzip -c "${LOCAL_BACKUP_PATH}" > "${TEMP_RESTORE_FILE}" 2>/dev/null
    
    # Execute restore
    if mysql -h "${MYSQL_HOST}" -u "${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" < "${TEMP_RESTORE_FILE}" 2>&1 | tee -a "${RESTORE_LOG_FILE}"; then
        log_info "✓ Restore completed successfully"
        
        # Cleanup temp file
        rm -f "${TEMP_RESTORE_FILE}"
        
        # Verify restore
        log_info ""
        log_info "Verifying restored databases..."
        RESTORED_DATABASES=$(mysql -h "${MYSQL_HOST}" -u "${MYSQL_ROOT_USER}" -p"${MYSQL_ROOT_PASSWORD}" -e "SHOW DATABASES;" 2>/dev/null | grep -v "^Database$\|^mysql\|^information_schema\|^performance_schema\|^sys")
        
        log_info "Restored databases:"
        echo "$RESTORED_DATABASES" | sed 's/^/  - /' | tee -a "${RESTORE_LOG_FILE}"
    else
        log_error "Restore failed - see error output above"
        rm -f "${TEMP_RESTORE_FILE}"
        exit 1
    fi
fi

log_info ""
log_info "================================"
log_info "✓ Restore Process Complete"
log_info "================================"
log_info "Log file: ${RESTORE_LOG_FILE}"
log_info ""
