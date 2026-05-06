# MMS MySQL Backup Operations Guide

## Overview

This document describes the backup and restore procedures for the MMS MySQL database infrastructure. Backups are performed **4 times daily** (every 6 hours) and stored in two locations for redundancy:

- **Local Storage**: 15 GiB persistent volume claim (fast recovery)
- **Google Drive**: 15 GiB cloud storage (disaster recovery)

### Backup Schedule

| Time (UTC) | Schedule |
|-----------|----------|
| 00:00 | Midnight backup |
| 06:00 | 6 AM backup |
| 12:00 | Noon backup |
| 18:00 | 6 PM backup |

**RPO (Recovery Point Objective)**: 6 hours  
**RTO (Recovery Time Objective)**: <5 minutes (local restore)

---

## Backup Architecture

### Components

```
MySQL Database (10 GiB)
    ↓
backup.sh (mysqldump)
    ├→ Local PVC (/backup)        [15 GiB total]
    ├→ Gzip compression
    └→ Google Drive (rclone)       [15 GiB total]

CronJob (K8s) triggers every 6 hours
```

### Databases Backed Up

All 7 databases are included in each backup:
1. `auth_user` - User authentication
2. `courses` - Course information
3. `marks` - Assessment marks
4. `analytics` - Course analytics
5. `policy` - Grading policies
6. `notifications` - Notification logs
7. `feature_flags` - Feature toggle switches

---

## Backup Management

### Automatic Backups

Backups run automatically via Kubernetes CronJob. No manual intervention required under normal circumstances.

#### Monitor Backup Status

```bash
# Check if CronJob is active
kubectl get cronjob -n default | grep mysql-backup

# View next scheduled backup
kubectl get cronjob mysql-backup -o jsonpath='{.status.lastSuccessfulTime}'

# Check last few backup jobs
kubectl get jobs -n default | grep mysql-backup

# View logs from last backup
kubectl logs -n default job/mysql-backup-<job-id> -c mysql-backup

# Monitor in real-time
kubectl logs -n default -f cronjob/mysql-backup
```

### Manual Backup Trigger

To run an unscheduled backup immediately:

```bash
# Create a one-off backup job
kubectl create job mysql-backup-manual-$(date +%s) --from=cronjob/mysql-backup -n default

# Monitor the manual backup
kubectl logs -f job/mysql-backup-manual-<timestamp> -n default
```

### List All Backups

Use the inventory utility to view all available backups:

```bash
# List both local and Google Drive backups
./list-backups.sh

# List only local backups
./list-backups.sh --local-only

# List only Google Drive backups
./list-backups.sh --gdrive-only

# Sort by file size instead of date
./list-backups.sh --sort-size
```

### Storage Retention Policy

**Automatic Cleanup**:
- When local storage exceeds 15 GiB, the oldest backup files are deleted automatically
- When Google Drive exceeds 15 GiB, the oldest files on Google Drive are removed
- Recent backups are always preserved for quick recovery

**Manual Cleanup**:

```bash
# Delete a specific local backup
rm /backup/backup-20260505-060000.sql.gz

# Delete backups older than 7 days
find /backup -name "backup-*.sql.gz" -mtime +7 -delete

# Delete backups from Google Drive (via rclone)
rclone delete gdrive:FOLDER_ID/backup-20260505-060000.sql.gz
```

---

## Restore Procedures

### Basic Restore (Interactive)

Restore the latest backup with confirmation prompt:

```bash
# Find the latest backup
LATEST_BACKUP=$(ls -1t /backup/backup-*.sql.gz | head -1 | xargs basename)

# Restore it (you'll be prompted to confirm)
./restore.sh $LATEST_BACKUP
```

### Restore by Timestamp

```bash
# Restore a specific backup by date
./restore.sh backup-20260505-180000.sql.gz
# or simply
./restore.sh 20260505-180000
```

### Dry-Run (Preview)

Preview SQL commands without executing any changes:

```bash
# Preview the first 100 SQL commands
./restore.sh backup-20260505-180000.sql.gz --dry-run
```

This shows:
- Backup structure and integrity check
- List of databases in the backup
- First 100 lines of SQL (CREATE TABLE, INSERT commands, etc.)
- No data is modified

### Restore from Google Drive

If the backup doesn't exist locally, it will be automatically downloaded from Google Drive:

```bash
# restore.sh will:
# 1. Check local /backup directory
# 2. If not found, download from Google Drive via rclone
# 3. Validate integrity
# 4. Perform restore

./restore.sh backup-20260505-060000.sql.gz
```

### Selective Database Restore

To restore only specific databases:

```bash
# Extract SQL from backup
gunzip -c /backup/backup-20260505-180000.sql.gz > restore.sql

# Edit restore.sql to keep only the databases you need
# Then restore it
mysql -h mysql -u root -p < restore.sql
```

---

## Troubleshooting

### Backup Failed

**Symptoms**: CronJob shows failed status

**Diagnosis**:
```bash
# Check CronJob events
kubectl describe cronjob mysql-backup -n default

# Check job logs
kubectl logs -n default job/mysql-backup-<recent-job> -c mysql-backup --tail=100

# Common issues in logs:
# - "Connection refused" → MySQL pod is not running
# - "Permission denied" → Secret credentials incorrect
# - "Disk quota exceeded" → PVC full or corrupted
```

**Solutions**:
```bash
# 1. Verify MySQL is running
kubectl get pod -n default | grep mysql

# 2. Verify backup PVC is mounted
kubectl describe pvc mysql-backup-pvc -n default

# 3. Check available space on PVC
kubectl exec -n default pod/mysql-0 -- df -h /var/lib/mysql

# 4. Verify secrets are correct
kubectl get secret mysql-secret -o yaml

# 5. Trigger manual backup to test
kubectl create job mysql-backup-test-$(date +%s) --from=cronjob/mysql-backup -n default
```

### High Storage Usage

**Symptoms**: Local or Google Drive backups exceed 15 GiB

**Check capacity**:
```bash
./list-backups.sh
```

**Manual cleanup** (if automatic cleanup failed):
```bash
# Delete backups older than 3 days
find /backup -name "backup-*.sql.gz" -mtime +3 -exec rm {} \;

# Verify new usage
./list-backups.sh
```

### Restore Fails

**Symptoms**: Restore script error or MySQL errors during restore

**Diagnosis**:
```bash
# Check MySQL connection
mysql -h mysql -u root -p -e "SELECT 1;"

# Test backup file integrity
gunzip --test /backup/backup-20260505-180000.sql.gz

# Check backup file size
ls -lh /backup/backup-20260505-180000.sql.gz
```

**Solutions**:
```bash
# 1. Use dry-run to preview
./restore.sh backup-20260505-180000.sql.gz --dry-run

# 2. Check MySQL has enough space
mysql -h mysql -u root -p -e "SHOW VARIABLES LIKE 'tmpdir';"

# 3. Manually restore with error logging
gunzip -c /backup/backup-20260505-180000.sql.gz | \
  mysql -h mysql -u root -p 2>&1 | tee restore-errors.log

# 4. Restore specific database only
gunzip -c /backup/backup-20260505-180000.sql.gz | \
  grep -A10000 "CREATE DATABASE \`courses\`" | \
  mysql -h mysql -u root -p
```

### Google Drive Connection Issues

**Symptoms**: Upload fails or Google Drive backups not appearing

**Diagnosis**:
```bash
# Test rclone Google Drive connection
rclone listremotes

# List Google Drive backups
rclone ls gdrive:GOOGLE_DRIVE_FOLDER_ID

# Test upload/download
rclone copy --dry-run /backup/test.txt gdrive:GOOGLE_DRIVE_FOLDER_ID
```

**Solutions**:
```bash
# 1. Verify rclone credentials in K8s secret
kubectl get secret mysql-secret -o yaml | grep RCLONE

# 2. Reconfigure Google Drive authentication
# Stop CronJob temporarily
kubectl patch cronjob mysql-backup -p '{"spec":{"suspend":true}}'

# Regenerate rclone config (see Phase 1 setup)
rclone authorize drive

# Update secret with new token
kubectl patch secret mysql-secret -p '{"stringData":{"RCLONE_CONFIG_GDRIVE_TOKEN":"new-token"}}'

# Re-enable CronJob
kubectl patch cronjob mysql-backup -p '{"spec":{"suspend":false}}'
```

---

## Setup & Configuration

### Prerequisites

- Kubernetes cluster with kubectl access
- Google Drive folder for backups (and rclone authentication)
- MySQL with root access (for restore operations)
- rclone CLI tool (for local restore operations from Google Drive)

### Initial Setup

Before backups can start:

1. **Create Kubernetes resources**:
   ```bash
   # Create backup PVC
   kubectl apply -f mysql/manifests/backup-pvc.yaml
   
   # Create RBAC (ServiceAccount, Role, RoleBinding)
   kubectl apply -f mysql/manifests/backup-rbac.yaml
   
   # Create CronJob
   kubectl apply -f mysql/manifests/backup-cronjob.yaml
   ```

2. **Verify deployment**:
   ```bash
   kubectl get pvc mysql-backup-pvc
   kubectl get cronjob mysql-backup
   kubectl get sa mysql-backup
   ```

3. **Update credentials** in [mysql/manifests/secret.yaml](../manifests/secret.yaml):
   ```yaml
   GOOGLE_DRIVE_FOLDER_ID: "your-folder-id"
   RCLONE_CONFIG_GDRIVE_TOKEN: "your-oauth-token"
   ```

### Environment Variables

Set these before running restore scripts locally:

```bash
export MYSQL_HOST="mysql"                          # K8s DNS or IP
export MYSQL_ROOT_PASSWORD="your-password"         # MySQL root password
export GOOGLE_DRIVE_FOLDER_ID="folder-id"          # Google Drive folder ID
export BACKUP_DIR="/backup"                        # Local backup directory
export RCLONE_CONFIG="/etc/rclone/rclone.conf"     # rclone config path
```

---

## Disaster Recovery Scenarios

### Scenario 1: Single Database Corruption

**Goal**: Restore one database without affecting others

```bash
# 1. Dry-run to see database structure
./restore.sh backup-latest.sql.gz --dry-run

# 2. Extract corrupted database from backup
gunzip -c /backup/backup-latest.sql.gz > full-restore.sql

# 3. Edit full-restore.sql to keep ONLY:
#    - CREATE DATABASE for the corrupted DB
#    - All tables for that DB
#    - All data inserts for that DB

# 4. Apply selective restore
mysql -h mysql -u root -p < full-restore.sql
```

### Scenario 2: Complete Database Loss

**Goal**: Full restore of all databases

```bash
# List recent backups
./list-backups.sh

# Restore from most recent backup
./restore.sh backup-20260506-000000.sql.gz

# When prompted: type "yes" to confirm
# Wait for restore to complete (typically 2-3 minutes for ~10GB)

# Verify data was restored
mysql -h mysql -u root -p -e "SHOW DATABASES; SELECT COUNT(*) FROM courses.courses;"
```

### Scenario 3: Point-in-Time Recovery

**Goal**: Restore to a specific date/time

```bash
# Find backup closest to desired time
./list-backups.sh | grep "2026-05-05 12"

# Restore from that backup
./restore.sh backup-20260505-120000.sql.gz
```

---

## Performance & Optimization

### Backup Performance

- **Typical backup duration**: 3-5 minutes (10-12 GB databases)
- **Compression ratio**: ~50% (10 GB → 2-3 GB gzipped)
- **Google Drive upload**: 1-2 minutes (depending on network)

### Restore Performance

- **Typical restore duration**: 5-10 minutes
- **From local PVC**: ~3-5 minutes (fast I/O)
- **From Google Drive**: +1-2 minutes (download first)

### Optimize Storage

```bash
# Reduce backup frequency (requires CronJob edit)
# Current: 4x daily (every 6 hours)
# Option: Change to 2x daily (every 12 hours)
kubectl edit cronjob mysql-backup
# Change: "0 0,6,12,18 * * *" → "0 0,12 * * *"

# Delete very old backups
find /backup -name "backup-*.sql.gz" -mtime +30 -delete
```

---

## Best Practices

✅ **Do**:
- Test restore procedures regularly (monthly dry-run)
- Monitor backup completion via CronJob logs
- Keep credentials secure (use K8s secrets, not environment)
- Maintain both local and Google Drive copies for redundancy
- Document any manual restores performed

❌ **Don't**:
- Delete backups manually (let automatic retention handle it)
- Modify backup files after creation (invalidates integrity)
- Store credentials in scripts or Git
- Disable backups for extended periods
- Rely on a single backup location

---

## Support & Logs

### Important Log Locations

```
CronJob logs:
  kubectl logs -n default job/mysql-backup-<job-id> -c mysql-backup

Local backup logs:
  /backup/backup-*.log
  /backup/restore-*.log

Backup script error output:
  kubectl logs -n default <pod-name> --tail=500
```

### Debugging Commands

```bash
# Check all backup-related resources
kubectl get all -n default | grep backup

# Describe CronJob in detail
kubectl describe cronjob mysql-backup -n default

# Check Secret values
kubectl get secret mysql-secret -o yaml

# Verify PVC is accessible
kubectl exec -n default pod/mysql-0 -- ls -lh /backup

# Check rclone sync status
rclone ls gdrive:FOLDER_ID | wc -l
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-06 | Initial backup system implementation |

---

**Last Updated**: 2026-05-06  
**Maintained By**: DevOps Team  
**Related**: [backup.sh](../backup.sh), [restore.sh](../restore.sh), [list-backups.sh](../list-backups.sh)
