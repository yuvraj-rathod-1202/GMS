#!/bin/bash

# List MySQL Backups Utility
# Lists all backup files from local PVC and Google Drive with sizes and dates
# Usage: ./list-backups.sh [OPTIONS]

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
GOOGLE_DRIVE_FOLDER_ID="${GOOGLE_DRIVE_FOLDER_ID}"
MAX_STORAGE_GB=15

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${GREEN}✓${NC} $@"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $@"
}

log_error() {
    echo -e "${RED}✗${NC} $@"
}

log_header() {
    echo ""
    echo -e "${BLUE}=== $@ ===${NC}"
}

# Display usage
usage() {
    cat <<EOF
${BLUE}MySQL Backups List Utility${NC}

Usage: ./list-backups.sh [OPTIONS]

Options:
  --local-only          List only local backups
  --gdrive-only         List only Google Drive backups
  --sort-date           Sort by date (default)
  --sort-size           Sort by file size
  --help                Display this help message

Environment Variables:
  BACKUP_DIR            Local backup directory (default: /backup)
  GOOGLE_DRIVE_FOLDER_ID Google Drive folder ID
  RCLONE_CONFIG         Path to rclone config (default: /etc/rclone/rclone.conf)

Examples:
  ./list-backups.sh
  ./list-backups.sh --gdrive-only
  ./list-backups.sh --sort-size

EOF
    exit 0
}

# Parse arguments
LOCAL_ONLY=false
GDRIVE_ONLY=false
SORT_BY="date"

while [ $# -gt 0 ]; do
    case "$1" in
        --local-only)
            LOCAL_ONLY=true
            GDRIVE_ONLY=false
            shift
            ;;
        --gdrive-only)
            GDRIVE_ONLY=true
            LOCAL_ONLY=false
            shift
            ;;
        --sort-date)
            SORT_BY="date"
            shift
            ;;
        --sort-size)
            SORT_BY="size"
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

# Function to convert bytes to human-readable format
human_readable() {
    local bytes=$1
    if [ "$bytes" -lt 1024 ]; then
        echo "${bytes}B"
    elif [ "$bytes" -lt 1048576 ]; then
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes / 1024}")KB"
    elif [ "$bytes" -lt 1073741824 ]; then
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes / 1024 / 1024}")MB"
    else
        echo "$(awk "BEGIN {printf \"%.2f\", $bytes / 1024 / 1024 / 1024}")GB"
    fi
}

# Function to calculate total size in GB
calculate_total_gb() {
    local total_bytes=0
    local files=$1
    
    if [ -z "$files" ]; then
        echo "0.00"
        return
    fi
    
    while IFS= read -r line; do
        if [ ! -z "$line" ]; then
            local size=$(echo "$line" | awk '{print $1}')
            total_bytes=$((total_bytes + size))
        fi
    done <<< "$files"
    
    awk "BEGIN {printf \"%.2f\", $total_bytes / 1024 / 1024 / 1024}"
}

# List local backups
list_local_backups() {
    log_header "Local Backups (${BACKUP_DIR})"
    
    if [ ! -d "${BACKUP_DIR}" ]; then
        log_error "Backup directory not found: ${BACKUP_DIR}"
        return 1
    fi
    
    local backup_files=$(find "${BACKUP_DIR}" -maxdepth 1 -name "backup-*.sql.gz" -type f -printf "%s %TY-%Tm-%Td %TH:%TM:%TS %f\n" 2>/dev/null)
    
    if [ -z "$backup_files" ]; then
        log_warn "No local backups found"
        return 0
    fi
    
    # Sort backups
    if [ "$SORT_BY" == "size" ]; then
        backup_files=$(echo "$backup_files" | sort -rn)
    else
        backup_files=$(echo "$backup_files" | sort -k2,3 -r)
    fi
    
    # Display header
    printf "%-15s  %-19s  %-20s\n" "Size" "Date/Time" "Filename"
    printf "%-15s  %-19s  %-20s\n" "----" "---------" "--------"
    
    local total_size_bytes=0
    while IFS= read -r line; do
        if [ ! -z "$line" ]; then
            local size=$(echo "$line" | awk '{print $1}')
            local date=$(echo "$line" | awk '{print $2, $3}')
            local filename=$(echo "$line" | awk '{print $4}')
            local human_size=$(human_readable "$size")
            
            printf "%-15s  %-19s  %-20s\n" "$human_size" "$date" "$filename"
            
            total_size_bytes=$((total_size_bytes + size))
        fi
    done <<< "$backup_files"
    
    local total_gb=$(awk "BEGIN {printf \"%.2f\", $total_size_bytes / 1024 / 1024 / 1024}")
    echo ""
    log_info "Total local backup size: $total_gb GiB"
}

# List Google Drive backups
list_gdrive_backups() {
    log_header "Google Drive Backups"
    
    if [ -z "${GOOGLE_DRIVE_FOLDER_ID}" ]; then
        log_error "GOOGLE_DRIVE_FOLDER_ID not configured"
        return 1
    fi
    
    if ! command -v rclone &> /dev/null; then
        log_error "rclone not found. Please install rclone to access Google Drive backups."
        return 1
    fi
    
    # Get list from Google Drive
    local gdrive_files=$(rclone lsf "gdrive:${GOOGLE_DRIVE_FOLDER_ID}" --files-only 2>/dev/null | grep "backup-.*\.sql\.gz" || true)
    
    if [ -z "$gdrive_files" ]; then
        log_warn "No Google Drive backups found or unable to connect to Google Drive"
        return 0
    fi
    
    # Get detailed file info
    local backup_list=$(rclone lsj "gdrive:${GOOGLE_DRIVE_FOLDER_ID}" 2>/dev/null | grep "backup-.*\.sql\.gz" || true)
    
    if [ -z "$backup_list" ]; then
        log_warn "Unable to retrieve detailed backup information from Google Drive"
        return 0
    fi
    
    # Display header
    printf "%-15s  %-20s\n" "Size" "Filename"
    printf "%-15s  %-20s\n" "----" "--------"
    
    local total_size_bytes=0
    echo "$backup_list" | while IFS= read -r line; do
        if [ ! -z "$line" ]; then
            local filename=$(echo "$line" | grep -o '"Name":"[^"]*"' | cut -d'"' -f4 | tail -1)
            local size=$(echo "$line" | grep -o '"Size":[0-9]*' | cut -d':' -f2)
            
            if [ ! -z "$filename" ] && [ ! -z "$size" ]; then
                local human_size=$(human_readable "$size")
                printf "%-15s  %-20s\n" "$human_size" "$filename"
                total_size_bytes=$((total_size_bytes + size))
            fi
        fi
    done
    
    local total_gb=$(awk "BEGIN {printf \"%.2f\", $total_size_bytes / 1024 / 1024 / 1024}")
    echo ""
    log_info "Total Google Drive backup size: $total_gb GiB"
}

# Display capacity summary
show_capacity_summary() {
    log_header "Storage Capacity Summary"
    
    local local_size=0
    local gdrive_size=0
    
    # Calculate local size
    if [ -d "${BACKUP_DIR}" ]; then
        local_size=$(du -sb "${BACKUP_DIR}" 2>/dev/null | awk '{print $1}' || echo "0")
    fi
    
    # Calculate Google Drive size
    if [ -n "${GOOGLE_DRIVE_FOLDER_ID}" ] && command -v rclone &> /dev/null; then
        gdrive_size=$(rclone size "gdrive:${GOOGLE_DRIVE_FOLDER_ID}" --json 2>/dev/null | grep -o '"Bytes":[0-9]*' | cut -d':' -f2 || echo "0")
    fi
    
    local local_gb=$(awk "BEGIN {printf \"%.2f\", $local_size / 1024 / 1024 / 1024}")
    local gdrive_gb=$(awk "BEGIN {printf \"%.2f\", $gdrive_size / 1024 / 1024 / 1024}")
    local total_gb=$(awk "BEGIN {printf \"%.2f\", ($local_size + $gdrive_size) / 1024 / 1024 / 1024}")
    
    echo ""
    echo "Local Storage:        $local_gb GiB / 15 GiB"
    echo "Google Drive:         $gdrive_gb GiB / 15 GiB"
    echo "Total Usage:          $total_gb GiB / 30 GiB (combined)"
    echo ""
    
    if (( $(echo "$local_gb > 15" | bc -l) )); then
        log_warn "Local storage EXCEEDS 15 GiB limit!"
    else
        log_info "Local storage within limits"
    fi
    
    if (( $(echo "$gdrive_gb > 15" | bc -l) )); then
        log_warn "Google Drive storage EXCEEDS 15 GiB limit!"
    else
        log_info "Google Drive storage within limits"
    fi
}

# Main execution
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   MySQL Backup Inventory Utility       ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

if [ "$GDRIVE_ONLY" == "false" ]; then
    list_local_backups
fi

if [ "$LOCAL_ONLY" == "false" ] && [ -n "${GOOGLE_DRIVE_FOLDER_ID}" ]; then
    list_gdrive_backups
fi

if [ "$LOCAL_ONLY" == "false" ] && [ "$GDRIVE_ONLY" == "false" ]; then
    show_capacity_summary
fi

echo ""
log_info "List complete at $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
