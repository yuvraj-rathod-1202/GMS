# Backup System Setup & Deployment Guide

## Quick Start

This guide walks you through deploying the complete MySQL backup and recovery system for GMS.

### Prerequisites

- Kubernetes cluster with kubectl configured
- Docker installed (to build backup container)
- MySQL with root access (for restore testing)
- Google Drive account and folder (for cloud backups)
- rclone installed (for Google Drive access)

---

## Step 1: Prepare Google Drive Authentication (5 minutes)

### Option A: Service Account (Use ONLY with Shared Drive)

```bash
# 1. Create Google Cloud Project
#    Visit: https://console.cloud.google.com

# 2. Create Service Account
#    APIs & Services → Credentials → Create Service Account
#    Name: "GMS Backup"
#    Click Create

# 3. Generate JSON Key
#    Keys → Add Key → Create new key → JSON
#    Save as: gms-backup-service-account.json

# 4. Encode credentials
BASE64_KEY=$(base64 -w 0 gms-backup-service-account.json)
echo $BASE64_KEY

# 5. Create a Shared Drive folder (not My Drive)
#    Service accounts cannot use personal My Drive quota.
#    Create Shared Drive, then grant service account access.

# 6. Get folder ID from URL
#    https://drive.google.com/drive/folders/[FOLDER_ID]
GOOGLE_DRIVE_FOLDER_ID="your-folder-id"
```

### Option B: OAuth Token (Recommended for personal Google Drive)

```bash
# 1. Install rclone
apt-get install rclone  # Debian/Ubuntu
brew install rclone     # macOS

# 2. Generate OAuth token
rclone authorize drive

# 3. Follow browser prompts to authorize
#    Copy the token that appears

# 4. Create Google Drive folder and get ID
#    Same as Step A above

# 5. Store token and folder ID for later
#    Put the raw token JSON in one line (or base64 of it) into secret key RCLONE_CONFIG_GDRIVE_TOKEN
RCLONE_TOKEN='{"access_token":"...","token_type":"Bearer","refresh_token":"...","expiry":"..."}'
GOOGLE_DRIVE_FOLDER_ID="your-folder-id"
```

---

## Step 2: Update Kubernetes Secrets (5 minutes)

```bash
# 1. Edit the secret manifest
vi mysql/manifests/secret.yaml

# 2. Update the following values:
#    GOOGLE_DRIVE_FOLDER_ID: "your-actual-folder-id"
#    RCLONE_CONFIG_GDRIVE_TOKEN: "oauth-token-json OR service-account-json"

# 3. Verify no placeholders remain
grep "REPLACE_WITH" mysql/manifests/secret.yaml
# (Should return nothing)

# 4. Apply secret to Kubernetes
kubectl apply -f mysql/manifests/secret.yaml

# 5. Verify secret was created
kubectl get secret mysql-secret -o yaml
```

---

## Step 3: Build and Push Backup Container (5-10 minutes)

```bash
# 1. Set registry variables
REGISTRY="ghcr.io"
IMAGE_PREFIX="yuvraj-rathod-1202/gms"
IMAGE_TAG=$(git rev-parse --short HEAD)

# 2. Build backup container
docker build -t ${REGISTRY}/${IMAGE_PREFIX}-mysql-backup:${IMAGE_TAG} \
             -f mysql/backup.Dockerfile \
             mysql/

# 3. Tag as latest
docker tag ${REGISTRY}/${IMAGE_PREFIX}-mysql-backup:${IMAGE_TAG} \
           ${REGISTRY}/${IMAGE_PREFIX}-mysql-backup:latest

# 4. Push to registry
docker push ${REGISTRY}/${IMAGE_PREFIX}-mysql-backup:${IMAGE_TAG}
docker push ${REGISTRY}/${IMAGE_PREFIX}-mysql-backup:latest

# 5. Verify image is accessible
docker pull ${REGISTRY}/${IMAGE_PREFIX}-mysql-backup:latest
```

**If using different registry**:
```bash
# Update image references in:
# - mysql/manifests/backup-cronjob.yaml
# - mysql/manifests/backup-job-manual.yaml
```

---

## Step 4: Deploy Backup Infrastructure (5 minutes)

```bash
# 1. Deploy backup storage PVC
kubectl apply -f mysql/manifests/backup-pvc.yaml

# 2. Verify PVC is created
kubectl get pvc mysql-backup-pvc

# 3. Deploy RBAC (ServiceAccount, Role, RoleBinding)
kubectl apply -f mysql/manifests/backup-rbac.yaml

# 4. Verify RBAC resources
kubectl get sa mysql-backup
kubectl get role mysql-backup
kubectl get rolebinding mysql-backup

# 5. Deploy CronJob
kubectl apply -f mysql/manifests/backup-cronjob.yaml

# 6. Verify CronJob is active
kubectl get cronjob mysql-backup
kubectl describe cronjob mysql-backup
```

---

## Step 5: Test Initial Backup (10 minutes)

```bash
# 1. Trigger manual backup
JOB_ID=$(kubectl create -f mysql/manifests/backup-job-manual.yaml -o jsonpath='{.metadata.name}')

# 2. Get the job name
echo "$JOB_ID"

# 3. Watch the backup progress
kubectl logs -f job/$JOB_ID -c mysql-backup

# 4. Wait for completion (3-5 minutes)
kubectl wait --for=condition=complete job/$JOB_ID --timeout=600s

# 5. Check backup results
kubectl exec -n default pod/mysql-0 -- ls -lh /backup/

# 6. Verify backup size
BACKUP_FILE=$(ls -1t /backup/backup-*.sql.gz | head -1)
ls -lh $BACKUP_FILE
```

---

## Step 6: Verify Google Drive Upload (5 minutes)

```bash
# 1. List backups on Google Drive via rclone
rclone ls gdrive:FOLDER_ID | grep backup

# 2. Check file size matches local
rclone lsf -R gdrive:FOLDER_ID | grep backup-

# 3. Verify in Google Drive web UI
#    Open https://drive.google.com
#    Navigate to GMS-Backups folder
#    Confirm backup file is present
```

---

## Step 7: Test Restore Procedures (5 minutes)

```bash
# 1. Set environment for testing
export MYSQL_HOST="mysql"
export MYSQL_ROOT_PASSWORD="GMS2026Root"
export GOOGLE_DRIVE_FOLDER_ID="your-folder-id"
export BACKUP_DIR="/backup"

# 2. List available backups
./mysql/list-backups.sh

# 3. Run dry-run validation
LATEST=$(ls -1t /backup/backup-*.sql.gz | head -1)
./mysql/restore.sh $LATEST --dry-run

# 4. Run validation tests
./mysql/validate-restore.sh --verbose

# 5. Check test results
# Should see: "All validation tests PASSED ✓"
```

---

## Step 8: Setup Monitoring (Optional, 5 minutes)

### Basic Monitoring (Manual Checks)

```bash
# Add to your crontab (runs every hour)
0 * * * * /path/to/monitor-backups.sh --all >> /var/log/backup-monitor.log 2>&1

# View logs
tail -f /var/log/backup-monitor.log
```

### Slack Integration

```bash
# 1. Create Slack webhook
#    https://api.slack.com/apps → Create New App
#    Enable Incoming Webhooks
#    Get webhook URL

# 2. Add to secret
kubectl patch secret backup-secrets -p '{"stringData":{"SLACK_WEBHOOK":"https://hooks.slack.com/..."}}'

# 3. Run monitoring with alerts
./mysql/monitor-backups.sh --all --webhook $SLACK_WEBHOOK
```

---

## Step 9: Verification Checklist

Run through this checklist to confirm everything is working:

```bash
# CronJob is active and scheduled
kubectl get cronjob mysql-backup -n default
# Expected: mysql-backup   0 0,6,12,18 * * *   False   1s    created...

# RBAC is configured
kubectl get sa mysql-backup -n default
kubectl get role mysql-backup -n default

# Backup PVC exists and is mounted
kubectl get pvc mysql-backup-pvc
kubectl exec -n default pod/mysql-0 -- test -d /backup && echo "✓ PVC mounted"

# Secret has credentials
kubectl get secret mysql-secret -o jsonpath='{.data.GOOGLE_DRIVE_FOLDER_ID}' | base64 -d
kubectl get secret mysql-secret -o jsonpath='{.data.RCLONE_CONFIG_GDRIVE_TOKEN}' | base64 -d | head -c 20

# Recent backup exists
ls -lh /backup/backup-*.sql.gz | head -1

# Backup is on Google Drive
rclone ls gdrive:FOLDER_ID | head -3

# Restore test passes
./mysql/validate-restore.sh
# Expected: "All validation tests PASSED ✓"

# Monitoring works
./mysql/monitor-backups.sh --all
# Expected: "Overall Status: OK" and "All checks passed"
```

---

## Step 10: Document Credentials & Access

Create a secure backup of credentials:

```bash
# Save to secure location (password-protected, encrypted, off-site)
# DO NOT commit to Git

cat > /secure/location/backup-credentials.txt <<EOF
GMS Backup System Credentials
Generated: $(date)

Google Drive Folder ID: FOLDER_ID
Rclone Token: TOKEN_OR_SERVICE_ACCOUNT_JSON
K8s Secret Name: mysql-secret
K8s Namespace: default

Backup Storage: /backup (local PVC)
Backup Schedule: 4x daily (0, 6, 12, 18 UTC)
Expected Backup Size: 2-3 GB
Expected Restore Time: 5-10 minutes

Important URLs:
- CronJob: kubectl get cronjob mysql-backup
- Storage: kubectl exec pod/mysql-0 -- ls -lh /backup
- Logs: kubectl logs -f cronjob/mysql-backup
- Google Drive: https://drive.google.com/drive/folders/FOLDER_ID

Emergency Contacts:
- Lead: [Name]
- Backup: [Name]
EOF

chmod 600 /secure/location/backup-credentials.txt
```

---

## Deployment Troubleshooting

### Issue: CronJob Not Running

```bash
# Check if CronJob is suspended
kubectl get cronjob mysql-backup -o jsonpath='{.spec.suspend}'

# If true, unsuspend it
kubectl patch cronjob mysql-backup -p '{"spec":{"suspend":false}}'

# Check for errors in CronJob definition
kubectl describe cronjob mysql-backup
kubectl get cronjob mysql-backup -o yaml
```

### Issue: Backup Job Fails

```bash
# Get recent failed job
FAILED_JOB=$(kubectl get jobs -n default -l app=mysql-backup --field-selector status.failed=1 | tail -1 | awk '{print $1}')

# View logs
kubectl logs -n default job/$FAILED_JOB -c mysql-backup --tail=100

# Common errors:
# - "Connection refused" → MySQL not running
# - "Permission denied" → Secret not set correctly
# - "Disk quota exceeded" → PVC full
```

### Issue: Google Drive Upload Fails

```bash
# Test rclone connection
rclone listremotes
rclone ls gdrive:/ | head

# Check secret
kubectl get secret mysql-secret -o yaml | grep RCLONE

# Recreate secret with new credentials
kubectl delete secret mysql-secret
kubectl create secret generic mysql-secret --from-literal=RCLONE_CONFIG_GDRIVE_TOKEN="new-token"
```

### Issue: Restore Test Fails

```bash
# Check MySQL connectivity
mysql -h mysql -u root -p -e "SELECT 1;"

# Verify backup file integrity
gunzip --test /backup/backup-20260506-000000.sql.gz

# Try restore with dry-run
./mysql/restore.sh backup-latest.sql.gz --dry-run

# Check MySQL error logs
kubectl logs pod/mysql-0 -c mysql | tail -50
```

---

## Post-Deployment Tasks

### Day 1
- ✅ Verify backup ran at 00:00 UTC
- ✅ Confirm file appears on Google Drive
- ✅ Test restore from backup

### Week 1
- ✅ Review monitoring logs
- ✅ Conduct first full restore drill on staging
- ✅ Document any issues and fixes

### Monthly
- ✅ Full restore test on dev environment
- ✅ Update documentation
- ✅ Review and optimize retention policy

---

## Next Steps

1. **Production Hardening**:
   - Enable backup encryption
   - Setup automated alerts to Slack/email
   - Implement redundant storage (s3 backup)

2. **High Availability**:
   - Setup MySQL replication
   - Configure automated failover
   - Implement point-in-time recovery

3. **Compliance & Audit**:
   - Document RTO/RPO
   - Track all restore operations
   - Implement backup immutability

---

## Support Resources

| File | Purpose |
|------|---------|
| `BACKUP.md` | Operations guide |
| `MONITORING.md` | Monitoring setup |
| `backup.sh` | Backup script |
| `restore.sh` | Restore utility |
| `monitor-backups.sh` | Health checks |
| `validate-restore.sh` | Restore testing |
| `list-backups.sh` | Backup inventory |

---

## Quick Reference Commands

```bash
# Check backup status
kubectl get cronjob mysql-backup

# View latest backup logs
kubectl logs -f cronjob/mysql-backup --tail=100

# List all backups
./mysql/list-backups.sh

# Restore latest backup (preview)
./mysql/restore.sh backup-latest.sql.gz --dry-run

# Restore latest backup (execute)
./mysql/restore.sh backup-latest.sql.gz

# Run health check
./mysql/monitor-backups.sh --all

# Validate restore procedure
./mysql/validate-restore.sh
```

---

**Deployment Complete!** Your GMS database backup system is now operational.

For questions or issues, refer to `BACKUP.md` and `MONITORING.md` documentation.

---

**Last Updated**: 2026-05-06
