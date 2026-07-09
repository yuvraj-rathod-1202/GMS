# Backup Monitoring & Alerting Guide

## Overview

This guide describes how to monitor MySQL backup operations and set up automated alerts for failures. The monitoring system validates:

- ✓ CronJob scheduling and execution
- ✓ Backup file creation and integrity
- ✓ Storage capacity usage
- ✓ Google Drive synchronization
- ✓ Restore procedures (validation testing)

---

## Monitoring Tools

### 1. Backup Monitoring Script

The `monitor-backups.sh` script performs comprehensive health checks on the backup system.

#### Basic Usage

```bash
# Run all checks
./monitor-backups.sh --all

# Check only CronJob status
./monitor-backups.sh --check-cronjob

# Check only storage capacity
./monitor-backups.sh --check-storage

# Check only latest backup existence
./monitor-backups.sh --check-latest

# Validate backup integrity
./monitor-backups.sh --validate-backup

# Verbose output
./monitor-backups.sh --all --verbose
```

#### Checks Performed

**CronJob Status Check**:
- Verifies CronJob exists and is not suspended
- Checks last successful backup time
- Alerts if backup is >12 hours old (should run every 6 hours)
- Validates recent job success rates
- Detects failed backup jobs

**Storage Capacity Check**:
- Calculates local PVC usage
- Calculates Google Drive usage
- Alerts if either location exceeds 15 GiB
- Warns when approaching capacity (>13 GiB)
- Validates automatic cleanup is working

**Latest Backup Check**:
- Verifies backup file exists
- Checks file age and size
- Confirms backup is recent (<12 hours old)

**Backup Integrity Check**:
- Validates gzip compression
- Verifies SQL content exists
- Counts databases in backup (should be ≥5)
- Confirms backup is not corrupted

#### Example Output

```
╔════════════════════════════════════════╗
║   MySQL Backup Monitoring Script       ║
╚════════════════════════════════════════╝

[INFO] === Checking CronJob Status ===
[INFO] CronJob: mysql-backup
[INFO] Suspended: false
[INFO] Last Success: 2026-05-06T00:00:15Z
[INFO] Last Schedule: 2026-05-06T00:00:00Z
[INFO] Hours since last successful backup: 2
[INFO] ✓ CronJob status is healthy

[INFO] === Checking Storage Capacity ===
[INFO] Local Storage:        9.24 GiB / 15 GiB
[INFO] Google Drive:         9.18 GiB / 15 GiB
[INFO] Total Usage:          18.42 GiB / 30 GiB (combined)
[INFO] ✓ Storage capacity is healthy

[INFO] === Checking Latest Backup ===
[INFO] Latest backup: backup-20260506-000000.sql.gz
[INFO] Size: 2.35 GB
[INFO] Age: 2 hours 5 minutes ago
[INFO] ✓ Latest backup exists and is current

[INFO] === Validating Backup Integrity ===
[INFO] Validating backup: backup-20260506-000000.sql.gz
[INFO] ✓ Gzip integrity check passed
[INFO] ✓ Backup contains valid SQL
[INFO] Databases in backup: 7
[INFO] ✓ Backup integrity validation passed

[INFO] ================================
[INFO] Backup Monitoring Report
[INFO] Timestamp: 2026-05-06 02:15:30
[INFO] Overall Status: OK
[INFO] ✓ All checks passed
```

---

### 2. Restore Validation Test Script

The `validate-restore.sh` script tests backup integrity and restore procedures safely.

#### Usage

```bash
# Run all validation tests
./validate-restore.sh

# Test specific backup
./validate-restore.sh --test-backup backup-20260505-180000.sql.gz

# Keep test databases after validation (for inspection)
./validate-restore.sh --keep-test-dbs

# Preview tests without executing (dry-run)
./validate-restore.sh --dry-run

# Verbose output
./validate-restore.sh --verbose
```

#### Tests Performed

| Test | Purpose | Actions |
|------|---------|---------|
| MySQL Connection | Verify test MySQL is accessible | Connects to TEST_MYSQL_HOST |
| Backup Availability | Ensure backup file exists | Searches /backup for latest .sql.gz |
| Backup Integrity | Validate backup structure | Tests gzip, verifies SQL content |
| Selective Restore | Test database-level restore | Restores one database to test DB |
| Backup Statistics | Collect backup metadata | Measures size, compression, line count |
| Restore Performance | Estimate full restore time | Times single DB restore, extrapolates |

#### Example Output

```
╔═════════════════════════════════════════╗
║   Backup Restore Validation Test        ║
╚═════════════════════════════════════════╝

[INFO] Starting backup validation tests...

[INFO] === Test 1: MySQL Connection ===
[PASS] Successfully connected to MySQL at localhost

[INFO] === Test 2: Backup File Availability ===
[INFO] Using backup: backup-20260506-000000.sql.gz (2.35 GB)
[PASS] Backup file found and accessible

[INFO] === Test 3: Backup Integrity ===
[PASS] Gzip integrity check passed
[INFO] Backup contains: 7 databases, 42 tables
[PASS] Backup contains valid SQL structure

[INFO] === Test 4: Selective Database Restore ===
[INFO] Testing restore of database: courses
[PASS] Selective database restore successful
[PASS] Restored database is accessible
[INFO] Restored database contains 15 tables

[INFO] === Test 5: Backup Statistics ===
[INFO] Uncompressed size: 10.2 GB
[INFO] Compressed size: 2.35 GB
[INFO] Compression ratio: 77.0%
[INFO] Total SQL lines: 1,234,567
[PASS] Backup statistics collected

[INFO] === Test 6: Restore Performance (Estimation) ===
[INFO] Restore time: 3.5s
[INFO] Estimated full backup restore time: ~5.3s
[PASS] Restore performance measured

[INFO] ================================
[INFO] Test Summary
[INFO] Tests Passed: 6
[INFO] Tests Failed: 0

[PASS] All validation tests PASSED ✓
```

---

## Automated Monitoring Setup

### Option 1: Kubernetes CronJob Monitoring

Monitor backups directly from Kubernetes with status checks:

```bash
# View CronJob status
kubectl get cronjob mysql-backup -n default

# Check recent job history
kubectl get jobs -n default -l app=mysql-backup --sort-by=.metadata.creationTimestamp

# View last backup log
kubectl logs -n default job/mysql-backup-<latest-job-id> -c mysql-backup

# Monitor in real-time
kubectl logs -n default -f cronjob/mysql-backup
```

### Option 2: Scheduled Monitoring Script

Create a K8s CronJob that runs the monitoring script:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-monitor
spec:
  # Run monitoring every hour
  schedule: "0 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: mysql-backup
          containers:
          - name: monitor
            image: alpine:latest
            command:
              - /bin/sh
              - -c
              - |
                apk add bash curl
                cd /scripts
                ./monitor-backups.sh --all --webhook $SLACK_WEBHOOK
            env:
            - name: SLACK_WEBHOOK
              valueFrom:
                secretKeyRef:
                  name: backup-secrets
                  key: slack-webhook
            - name: BACKUP_DIR
              value: /backup
            volumeMounts:
            - name: scripts
              mountPath: /scripts
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: scripts
            configMap:
              name: backup-scripts
              defaultMode: 0755
          - name: backup-storage
            persistentVolumeClaim:
              claimName: mysql-backup-pvc
          restartPolicy: OnFailure
```

### Option 3: External Monitoring (Linux Host)

Run monitoring on a host with access to backup storage:

```bash
# Add to crontab to run every hour
0 * * * * /path/to/monitor-backups.sh --all --webhook $SLACK_WEBHOOK >> /var/log/backup-monitor.log 2>&1

# View logs
tail -f /var/log/backup-monitor.log
```

---

## Alert Integration

### Slack Integration

Send backup alerts to Slack:

```bash
# Get Slack webhook URL from your workspace:
# 1. Go to https://api.slack.com/apps
# 2. Create New App → From scratch
# 3. Enable Incoming Webhooks
# 4. Add New Webhook to Workspace
# 5. Copy Webhook URL

# Run with Slack alerting
./monitor-backups.sh --all --webhook https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Example Slack Message**:
```
GMS Database Backup Alert
Severity: error
Timestamp: 2026-05-06 14:30:15

Issues Found:
- Last backup is 15 hours old (expected every 6 hours)
- Local storage exceeds 15 GiB limit: 16.2 GiB used
```

### Email Integration

Send backup alerts via email:

```bash
# Ensure 'mail' command is available
apt-get install mailutils  # on Debian/Ubuntu

# Run with email alerting
./monitor-backups.sh --all --email devops@example.com
```

### Custom Webhook Integration

For Teams, custom services, or webhooks:

```bash
# Modify monitor-backups.sh to add custom webhook format
# The script sends JSON payload - customize as needed

# Example for MS Teams:
./monitor-backups.sh --all --webhook https://outlook.webhook.office.com/webhookb2/...
```

---

## Daily Validation Procedures

### Weekly Restore Test (Recommended)

Test restore procedures weekly on a staging environment:

```bash
# Set test environment
export TEST_MYSQL_HOST="staging-mysql"
export TEST_MYSQL_PASSWORD="staging-password"

# Run validation
./validate-restore.sh --verbose

# Review test results
tail -20 /var/log/backup-validation.log
```

### Monthly Full Restore Drill

Practice full recovery on dev environment (monthly):

```bash
# 1. Get latest backup
LATEST=$(ls -1t /backup/backup-*.sql.gz | head -1)

# 2. Create temporary database for test
mysql -h dev-mysql -u root -p -e "CREATE DATABASE test_full_restore;"

# 3. Restore to test database
./restore.sh $LATEST --dry-run  # Preview first
./restore.sh $LATEST            # Execute

# 4. Validate data integrity
mysql -h dev-mysql -u root -p -e "SELECT COUNT(*) FROM test_full_restore.courses;"

# 5. Cleanup
mysql -h dev-mysql -u root -p -e "DROP DATABASE test_full_restore;"
```

---

## Monitoring Dashboard (Optional)

### Prometheus Metrics Export

Create a script to export backup metrics to Prometheus:

```bash
#!/bin/bash
# Export metrics for Prometheus scraping

PORT=9100
FILE=/var/lib/node_exporter/textfile_collector/backups.prom

{
  # Local backup size
  local_size=$(du -sb /backup | awk '{print $1}')
  echo "# HELP backup_local_size_bytes Local backup storage size in bytes"
  echo "# TYPE backup_local_size_bytes gauge"
  echo "backup_local_size_bytes $local_size"
  
  # Latest backup age
  latest_backup=$(ls -1t /backup/backup-*.sql.gz | head -1)
  if [ -f "$latest_backup" ]; then
    backup_age=$(($(date +%s) - $(stat -c%Y "$latest_backup")))
    echo "# HELP backup_latest_age_seconds Age of latest backup in seconds"
    echo "# TYPE backup_latest_age_seconds gauge"
    echo "backup_latest_age_seconds $backup_age"
  fi
  
  # CronJob status
  cronjob_suspended=$(kubectl get cronjob mysql-backup -o jsonpath='{.spec.suspend}')
  echo "# HELP backup_cronjob_suspended CronJob suspension status (1=suspended, 0=active)"
  echo "# TYPE backup_cronjob_suspended gauge"
  echo "backup_cronjob_suspended $cronjob_suspended"
} > $FILE
```

---

## Troubleshooting Monitoring Issues

### Monitoring Script Fails to Connect

```bash
# Check if kubectl is available
which kubectl

# Verify CronJob access
kubectl get cronjob mysql-backup -n default

# Check RBAC permissions
kubectl auth can-i get jobs --as=system:serviceaccount:default:mysql-backup
```

### Webhook Alerts Not Sending

```bash
# Test webhook connectivity
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test alert"}' \
  $SLACK_WEBHOOK

# Check firewall/proxy
curl -v https://hooks.slack.com/services/YOUR/WEBHOOK
```

### Email Alerts Not Sending

```bash
# Test mail command
echo "Test" | mail -s "Test Subject" your-email@example.com

# Check mail service
systemctl status postfix  # or sendmail

# View mail logs
tail -f /var/log/mail.log
```

---

## Performance Baseline

Establish performance baselines for alerting:

| Metric | Expected | Warning | Critical |
|--------|----------|---------|----------|
| Backup Duration | 3-5 min | >10 min | >15 min |
| Backup Size | 2-3 GB | >13 GB | >15 GB |
| Restore Duration | 5-10 min | >15 min | >20 min |
| Storage Usage | <10 GB | >13 GB | >15 GB |
| Backup Age | <6 hrs | >12 hrs | >24 hrs |

---

## Monitoring Checklist

**Daily**:
- ☑ Review backup logs: `kubectl logs cronjob/mysql-backup`
- ☑ Check storage usage: `./list-backups.sh`

**Weekly**:
- ☑ Run validation test: `./validate-restore.sh`
- ☑ Review monitoring alerts

**Monthly**:
- ☑ Perform full restore drill on dev
- ☑ Update documentation with findings
- ☑ Review and adjust alert thresholds

---

## Support & Escalation

### Alert Response Procedure

1. **Level 1 - Warning** (e.g., storage >13 GiB)
   - Investigate root cause
   - Manual cleanup if needed
   - No user impact expected

2. **Level 2 - Error** (e.g., backup >12 hours old)
   - Page on-call engineer
   - Restart CronJob if needed
   - Verify MySQL connectivity
   - Check PVC status

3. **Level 3 - Critical** (e.g., restore failure)
   - Page on-call + backup lead
   - Begin incident response
   - Activate disaster recovery plan
   - Notify stakeholders

---

## Files Reference

- `monitor-backups.sh` — Main monitoring script
- `validate-restore.sh` — Restore validation test
- `BACKUP.md` — Backup operations guide
- `backup.sh` — Main backup script
- `restore.sh` — Restore utility

---

**Last Updated**: 2026-05-06
