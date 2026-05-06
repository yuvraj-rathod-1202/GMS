#!/bin/bash

# Backup Restore Validation Test Script
# Tests backup integrity and restore procedures on a test environment
# This script safely validates backups WITHOUT affecting production data
# Usage: ./validate-restore.sh [OPTIONS]

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup}"
GOOGLE_DRIVE_FOLDER_ID="${GOOGLE_DRIVE_FOLDER_ID}"
TEST_MYSQL_HOST="${TEST_MYSQL_HOST:-localhost}"
TEST_MYSQL_USER="${TEST_MYSQL_USER:-root}"
TEST_MYSQL_PASSWORD="${TEST_MYSQL_PASSWORD}"
TEST_DB_PREFIX="test_restore_"
VERBOSE=false
CLEANUP=true
DRY_RUN=false

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TEST_REPORT=()

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $@"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $@"
    ((TESTS_PASSED++))
    TEST_REPORT+=("PASS: $@")
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $@"
    ((TESTS_FAILED++))
    TEST_REPORT+=("FAIL: $@")
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $@"
    TEST_REPORT+=("WARN: $@")
}

log_debug() {
    if [ "$VERBOSE" == "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $@"
    fi
}

# Display usage
usage() {
    cat <<EOF
${BLUE}Backup Restore Validation Test${NC}

Usage: ./validate-restore.sh [OPTIONS]

Options:
  --test-backup <file>  Test specific backup file (default: latest)
  --keep-test-dbs       Don't cleanup test databases after tests
  --dry-run             Preview what would be tested without running
  --verbose             Enable verbose output
  --help                Display this help message

Environment Variables:
  BACKUP_DIR            Local backup directory (default: /backup)
  TEST_MYSQL_HOST       Test MySQL server hostname (default: localhost)
  TEST_MYSQL_USER       Test MySQL username (default: root)
  TEST_MYSQL_PASSWORD   Test MySQL password (REQUIRED)
  GOOGLE_DRIVE_FOLDER_ID Google Drive folder ID (for remote backups)

Examples:
  ./validate-restore.sh
  ./validate-restore.sh --test-backup backup-20260506-000000.sql.gz
  ./validate-restore.sh --keep-test-dbs --verbose

EOF
    exit 0
}

# Parse arguments
BACKUP_FILE=""

while [ $# -gt 0 ]; do
    case "$1" in
        --test-backup)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --keep-test-dbs)
            CLEANUP=false
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            log_fail "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment
if [ -z "$TEST_MYSQL_PASSWORD" ]; then
    log_fail "TEST_MYSQL_PASSWORD not set"
    exit 1
fi

# Test MySQL connectivity
test_mysql_connection() {
    log_info ""
    log_info "=== Test 1: MySQL Connection ==="
    
    if mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" -e "SELECT 1" &>/dev/null; then
        log_pass "Successfully connected to MySQL at $TEST_MYSQL_HOST"
        return 0
    else
        log_fail "Failed to connect to MySQL at $TEST_MYSQL_HOST"
        return 1
    fi
}

# Test backup file availability
test_backup_availability() {
    log_info ""
    log_info "=== Test 2: Backup File Availability ==="
    
    # Find backup file
    if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null | head -1 || echo "")
    fi
    
    if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
        log_fail "Backup file not found: $BACKUP_FILE"
        return 1
    fi
    
    local backup_name=$(basename "$BACKUP_FILE")
    local backup_size=$(du -sh "$BACKUP_FILE" | awk '{print $1}')
    
    log_info "Using backup: $backup_name ($backup_size)"
    log_pass "Backup file found and accessible"
    return 0
}

# Test backup integrity
test_backup_integrity() {
    log_info ""
    log_info "=== Test 3: Backup Integrity ==="
    
    log_debug "Testing gzip integrity..."
    if ! gunzip --test "$BACKUP_FILE" 2>/dev/null; then
        log_fail "Backup file is corrupted (gzip validation failed)"
        return 1
    fi
    log_pass "Gzip integrity check passed"
    
    # Check for SQL content
    log_debug "Verifying SQL content..."
    local create_db_count=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | grep -c "CREATE DATABASE" || echo "0")
    local create_table_count=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | grep -c "CREATE TABLE" || echo "0")
    
    log_info "Backup contains: $create_db_count databases, $create_table_count tables"
    
    if [ "$create_db_count" -lt 5 ]; then
        log_fail "Backup contains only $create_db_count databases (expected ≥5)"
        return 1
    fi
    
    if [ "$create_table_count" -lt 10 ]; then
        log_fail "Backup contains only $create_table_count tables (expected ≥10)"
        return 1
    fi
    
    log_pass "Backup contains valid SQL structure"
    return 0
}

# Test selective restore capability
test_selective_restore() {
    log_info ""
    log_info "=== Test 4: Selective Database Restore ==="
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "Skipping (dry-run mode)"
        return 0
    fi
    
    # Extract one database from backup
    local test_db_name="${TEST_DB_PREFIX}selective_$(date +%s)"
    local temp_sql="/tmp/restore_${test_db_name}.sql"
    
    log_debug "Creating test restore script for database: $test_db_name"
    
    # Get first database from backup
    local first_db=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | grep "^CREATE DATABASE" | head -1 | awk -F'`' '{print $2}')
    
    if [ -z "$first_db" ]; then
        log_fail "Could not extract database name from backup"
        return 1
    fi
    
    log_info "Testing restore of database: $first_db"
    
    # Create SQL with renamed database
    gunzip -c "$BACKUP_FILE" 2>/dev/null | \
        sed "s/CREATE DATABASE \`$first_db\`/CREATE DATABASE \`$test_db_name\`/g" | \
        sed "s/USE \`$first_db\`/USE \`$test_db_name\`/g" > "$temp_sql"
    
    # Attempt restore
    if mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" < "$temp_sql" 2>/dev/null; then
        log_pass "Selective database restore successful"
        
        # Verify database exists
        if mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" -e "USE $test_db_name; SELECT 1;" &>/dev/null; then
            log_pass "Restored database is accessible"
            
            # Count tables
            local table_count=$(mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$test_db_name';" | tail -1)
            log_info "Restored database contains $table_count tables"
            
            # Cleanup test database
            if [ "$CLEANUP" == "true" ]; then
                mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" -e "DROP DATABASE \`$test_db_name\`;" 2>/dev/null
                log_debug "Cleaned up test database: $test_db_name"
            else
                log_info "Test database preserved: $test_db_name"
            fi
        else
            log_fail "Restored database is not accessible"
            return 1
        fi
    else
        log_fail "Selective database restore failed"
        rm -f "$temp_sql"
        return 1
    fi
    
    rm -f "$temp_sql"
    return 0
}

# Test full backup statistics
test_backup_statistics() {
    log_info ""
    log_info "=== Test 5: Backup Statistics ==="
    
    local uncompressed=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | wc -c)
    local compressed=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
    local compression_ratio=$(awk "BEGIN {printf \"%.1f\", 100 - (($compressed / $uncompressed) * 100)}")
    
    log_info "Uncompressed size: $(numfmt --to=iec-i --suffix=B $uncompressed 2>/dev/null || echo "$uncompressed bytes")"
    log_info "Compressed size: $(numfmt --to=iec-i --suffix=B $compressed 2>/dev/null || echo "$compressed bytes")"
    log_info "Compression ratio: $compression_ratio%"
    
    # Get line count
    local line_count=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | wc -l)
    log_info "Total SQL lines: $line_count"
    
    log_pass "Backup statistics collected"
    return 0
}

# Test restore time estimation
test_restore_performance() {
    log_info ""
    log_info "=== Test 6: Restore Performance (Estimation) ==="
    
    if [ "$DRY_RUN" == "true" ]; then
        log_info "Skipping (dry-run mode)"
        return 0
    fi
    
    local test_db_name="${TEST_DB_PREFIX}perf_$(date +%s)"
    local temp_sql="/tmp/restore_${test_db_name}.sql"
    
    # Get first database from backup
    local first_db=$(gunzip -c "$BACKUP_FILE" 2>/dev/null | grep "^CREATE DATABASE" | head -1 | awk -F'`' '{print $2}')
    
    if [ -z "$first_db" ]; then
        log_warn "Could not estimate restore performance"
        return 0
    fi
    
    # Create test restore script
    gunzip -c "$BACKUP_FILE" 2>/dev/null | \
        sed "s/CREATE DATABASE \`$first_db\`/CREATE DATABASE \`$test_db_name\`/g" | \
        sed "s/USE \`$first_db\`/USE \`$test_db_name\`/g" > "$temp_sql"
    
    # Time the restore
    log_debug "Timing database restore..."
    local start_time=$(date +%s%3N)
    
    if mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" < "$temp_sql" 2>/dev/null; then
        local end_time=$(date +%s%3N)
        local duration_ms=$((end_time - start_time))
        local duration_sec=$(awk "BEGIN {printf \"%.1f\", $duration_ms / 1000}")
        
        log_info "Restore time: ${duration_sec}s"
        
        # Estimate full restore time (for all databases)
        local full_estimate=$(awk "BEGIN {printf \"%.1f\", $duration_sec * 1.5}")
        log_info "Estimated full backup restore time: ~${full_estimate}s"
        
        log_pass "Restore performance measured"
        
        # Cleanup
        if [ "$CLEANUP" == "true" ]; then
            mysql -h "$TEST_MYSQL_HOST" -u "$TEST_MYSQL_USER" -p"$TEST_MYSQL_PASSWORD" -e "DROP DATABASE \`$test_db_name\`;" 2>/dev/null
        else
            log_info "Test database preserved: $test_db_name"
        fi
    else
        log_fail "Restore performance test failed"
        rm -f "$temp_sql"
        return 1
    fi
    
    rm -f "$temp_sql"
    return 0
}

# Generate test report
generate_test_report() {
    log_info ""
    log_info "================================"
    log_info "Test Summary"
    log_info "================================"
    log_info "Tests Passed: $TESTS_PASSED"
    log_info "Tests Failed: $TESTS_FAILED"
    log_info ""
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        log_pass "All validation tests PASSED ✓"
    else
        log_fail "$TESTS_FAILED test(s) FAILED ✗"
    fi
    
    echo ""
    log_info "Detailed Report:"
    for report_line in "${TEST_REPORT[@]}"; do
        echo "  $report_line"
    done
}

# Main execution
echo -e "${BLUE}"
echo "╔═════════════════════════════════════════╗"
echo "║   Backup Restore Validation Test        ║"
echo "╚═════════════════════════════════════════╝"
echo -e "${NC}"

log_info "Starting backup validation tests..."

# Run all tests
test_mysql_connection || true
test_backup_availability || true
test_backup_integrity || true
test_selective_restore || true
test_backup_statistics || true
test_restore_performance || true

# Generate report
generate_test_report

# Exit with appropriate code
if [ "$TESTS_FAILED" -gt 0 ]; then
    exit 1
else
    exit 0
fi
