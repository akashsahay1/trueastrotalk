# User Uploads Protection Strategy

## Critical Problem

**NEVER delete or overwrite `public/uploads/`!**

This directory contains:
- User profile images
- Uploaded documents
- Product images
- Media files
- Any user-generated content

❌ **What could go wrong:**
```bash
# DANGEROUS - This deletes all user uploads!
rsync -avz --delete admin/ server:/var/www/html/trueastrotalk/backend/
```

The `--delete` flag would **wipe out all user uploads**!

---

## Solution: Shared Uploads Directory

### Concept

Keep uploads in a **permanent location** outside deployment directories:

```
/var/www/html/trueastrotalk/
├── backend/                    # Deployment directory (gets replaced)
│   ├── src/
│   ├── public/
│   │   └── uploads -> /var/www/html/trueastrotalk/shared/uploads  # SYMLINK
│   └── ...
├── shared/                     # PERMANENT (never touched during deployment)
│   ├── uploads/               # All user files live here
│   ├── .env                   # Environment variables
│   └── logs/                  # Application logs
└── releases/                  # For blue-green deployment
    ├── 20250109_120000/
    ├── 20250109_150000/
    └── ...
```

---

## Implementation

### Step 1: One-Time Server Setup

**SSH into your server:**

```bash
ssh root@your-server-ip

# Navigate to application directory
cd /var/www/html/trueastrotalk

# Create shared directory structure
mkdir -p shared/uploads
mkdir -p shared/logs

# Move existing uploads to shared directory
if [ -d "backend/public/uploads" ]; then
  echo "Moving existing uploads to shared directory..."

  # Copy all files (preserving permissions)
  cp -rp backend/public/uploads/* shared/uploads/ 2>/dev/null || true

  # Backup original
  mv backend/public/uploads backend/public/uploads.backup

  echo "✓ Uploads moved to shared/uploads"
fi

# Create symlink from deployment to shared uploads
ln -s /var/www/html/trueastrotalk/shared/uploads /var/www/html/trueastrotalk/backend/public/uploads

# Verify
ls -la /var/www/html/trueastrotalk/backend/public/uploads
# Should show: uploads -> /var/www/html/trueastrotalk/shared/uploads

# Set proper permissions
chown -R www-data:www-data shared/uploads
chmod -R 755 shared/uploads

echo "✓ Shared uploads directory configured"
```

**Verify it worked:**

```bash
# Test - create a file in uploads
touch /var/www/html/trueastrotalk/backend/public/uploads/test.txt

# Check it exists in shared
ls -la /var/www/html/trueastrotalk/shared/uploads/test.txt

# Should see the same file!
```

### Step 2: Update .env to Shared Location (Optional)

```bash
# Move .env to shared directory
mv /var/www/html/trueastrotalk/backend/.env /var/www/html/trueastrotalk/shared/.env

# Create symlink
ln -s /var/www/html/trueastrotalk/shared/.env /var/www/html/trueastrotalk/backend/.env

# Set strict permissions
chmod 600 /var/www/html/trueastrotalk/shared/.env

echo "✓ Environment file protected"
```

---

## Safe Deployment Commands

### Frontend Deployment (Safe)

```bash
# Frontend has no user uploads - safe to use --delete
rsync -avz --delete \
  frontend/dist/ \
  root@server:/var/www/html/trueastrotalk/frontend/
```

### Admin Backend Deployment (Protected)

**Method 1: Rsync with Excludes (Recommended)**

```bash
# Safe deployment - excludes uploads and sensitive files
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'public/uploads' \
  --exclude '.env' \
  --exclude '.next/cache' \
  admin/ \
  root@server:/var/www/html/trueastrotalk/backend/
```

**Method 2: Deployment Script (Most Recommended)**

Create `deploy-admin.sh`:

```bash
#!/bin/bash

# Configuration
LOCAL_DIR="/Volumes/Projects/Projects/Trueastrotalk/trueastrotalk/admin"
SERVER_USER="root"
SERVER_HOST="your-server-ip"
SERVER_PATH="/var/www/html/trueastrotalk/backend"
SHARED_PATH="/var/www/html/trueastrotalk/shared"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting safe admin deployment...${NC}"

# 1. Build locally
echo "Building admin panel..."
cd "$LOCAL_DIR"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# 2. Upload with exclusions (SAFE - won't touch uploads)
echo "Uploading files (excluding uploads and sensitive data)..."
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.cache' \
  --exclude '.next/cache' \
  --exclude 'public/uploads' \
  --exclude 'public/uploads/*' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.*.local' \
  ./ \
  "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

if [ $? -ne 0 ]; then
    echo -e "${RED}Upload failed!${NC}"
    exit 1
fi

# 3. Install dependencies and reload on server
echo "Installing dependencies and reloading..."
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/html/trueastrotalk/backend

# Ensure symlinks exist
if [ ! -L "public/uploads" ]; then
    echo "Creating uploads symlink..."
    rm -rf public/uploads
    ln -s /var/www/html/trueastrotalk/shared/uploads public/uploads
fi

if [ ! -L ".env" ]; then
    echo "Creating .env symlink..."
    rm -f .env
    ln -s /var/www/html/trueastrotalk/shared/.env .env
fi

# Install dependencies
npm install --production

# Graceful reload (zero downtime)
pm2 reload ecosystem.production.js

echo "✓ Deployment complete!"
ENDSSH

echo -e "${GREEN}✓ Admin deployment successful!${NC}"
echo "Check status: ssh $SERVER_USER@$SERVER_HOST 'pm2 status'"
```

Make it executable:

```bash
chmod +x deploy-admin.sh
```

**Usage:**

```bash
# Deploy admin with zero downtime and upload protection
./deploy-admin.sh
```

---

## Verification Checklist

After setup, verify uploads are protected:

```bash
ssh root@your-server-ip

# 1. Check symlink exists
ls -la /var/www/html/trueastrotalk/backend/public/uploads
# Should show: uploads -> /var/www/html/trueastrotalk/shared/uploads

# 2. Verify shared directory has files
ls -la /var/www/html/trueastrotalk/shared/uploads/
# Should show user upload files

# 3. Test upload works
# Upload a file through your admin panel, then check:
ls -la /var/www/html/trueastrotalk/shared/uploads/
# Should see the newly uploaded file

# 4. Verify it's accessible via web
curl -I https://admin.trueastrotalk.com/uploads/some-file.jpg
# Should return 200 OK
```

---

## What Happens During Deployment

### Before (Unsafe):

```
/var/www/html/trueastrotalk/backend/
└── public/
    └── uploads/            # DELETED during rsync --delete
        ├── profile1.jpg    # ❌ LOST!
        ├── document.pdf    # ❌ LOST!
        └── ...             # ❌ LOST!
```

### After (Safe):

```
Deployment directory:
/var/www/html/trueastrotalk/backend/
└── public/
    └── uploads -> /var/www/html/trueastrotalk/shared/uploads  # SYMLINK

Permanent storage:
/var/www/html/trueastrotalk/shared/
└── uploads/                # NEVER TOUCHED
    ├── profile1.jpg        # ✓ SAFE
    ├── document.pdf        # ✓ SAFE
    └── ...                 # ✓ SAFE
```

**During deployment:**
1. Rsync excludes `public/uploads`
2. Symlink remains intact
3. Shared uploads directory untouched
4. All user files preserved ✓

---

## Backup Strategy for Uploads

### Automated Daily Backups

Create `/root/backup-uploads.sh`:

```bash
#!/bin/bash

# Configuration
UPLOADS_DIR="/var/www/html/trueastrotalk/shared/uploads"
BACKUP_DIR="/var/backups/trueastrotalk/uploads"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"

echo "Creating backup: $BACKUP_FILE"

# Create compressed backup
tar -czf "$BACKUP_FILE" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)"

# Verify backup
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✓ Backup created successfully: $SIZE"
else
    echo "✗ Backup failed!"
    exit 1
fi

# Remove old backups (keep last 30 days)
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "✓ Cleanup complete (keeping last $RETENTION_DAYS days)"
```

**Set up cron job:**

```bash
# Make script executable
chmod +x /root/backup-uploads.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /root/backup-uploads.sh >> /var/log/uploads-backup.log 2>&1
```

### Manual Backup

```bash
# Create immediate backup
ssh root@server

cd /var/www/html/trueastrotalk/shared
tar -czf /var/backups/uploads-$(date +%Y%m%d).tar.gz uploads/

echo "Backup created: /var/backups/uploads-$(date +%Y%m%d).tar.gz"
```

### Restore from Backup

```bash
# If you need to restore uploads
ssh root@server

cd /var/www/html/trueastrotalk/shared

# Backup current (just in case)
mv uploads uploads.old

# Extract backup
tar -xzf /var/backups/uploads-20250109.tar.gz

# Verify
ls -la uploads/

# Set permissions
chown -R www-data:www-data uploads/
chmod -R 755 uploads/

echo "Restore complete!"
```

---

## Cloud Storage Option (Advanced)

For better reliability, consider storing uploads in cloud storage:

### AWS S3 / DigitalOcean Spaces / Cloudflare R2

**Benefits:**
- Unlimited storage
- Automatic backups
- CDN delivery (faster)
- No server disk space issues
- Survives server failures

**Implementation:** (Future enhancement)

```typescript
// Example: Upload to S3 instead of local filesystem
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY
});

// Upload file
await s3.upload({
  Bucket: 'trueastrotalk-uploads',
  Key: `uploads/${filename}`,
  Body: fileBuffer,
  ACL: 'public-read'
}).promise();
```

---

## Disaster Recovery Plan

### Scenario 1: Accidentally Deleted Uploads

```bash
# Stop application
pm2 stop all

# Restore from latest backup
cd /var/www/html/trueastrotalk/shared
rm -rf uploads
tar -xzf /var/backups/uploads-latest.tar.gz

# Set permissions
chown -R www-data:www-data uploads/

# Restart
pm2 start all
```

### Scenario 2: Corrupted Uploads Directory

```bash
# Verify backup exists
ls -lh /var/backups/uploads-*.tar.gz

# Restore specific backup
cd /var/www/html/trueastrotalk/shared
mv uploads uploads.corrupted
tar -xzf /var/backups/uploads-20250108.tar.gz
chown -R www-data:www-data uploads/

# Compare files
diff -r uploads/ uploads.corrupted/
```

---

## Monitoring Uploads Directory

### Check Disk Usage

```bash
# See uploads directory size
du -sh /var/www/html/trueastrotalk/shared/uploads

# See individual file sizes (top 10 largest)
du -ah /var/www/html/trueastrotalk/shared/uploads | sort -rh | head -10

# Watch disk space
df -h /var/www/html/trueastrotalk/shared/
```

### Set Up Alerts

Add to monitoring script:

```bash
#!/bin/bash

# Alert if uploads directory exceeds 10GB
UPLOADS_SIZE=$(du -sm /var/www/html/trueastrotalk/shared/uploads | cut -f1)
MAX_SIZE_MB=10240  # 10GB

if [ "$UPLOADS_SIZE" -gt "$MAX_SIZE_MB" ]; then
    echo "WARNING: Uploads directory is ${UPLOADS_SIZE}MB (max: ${MAX_SIZE_MB}MB)"
    # Send email alert or notification
fi
```

---

## Quick Reference

### Safe Deployment Commands

```bash
# ✓ SAFE - Frontend deployment
rsync -avz --delete frontend/dist/ server:/var/www/html/trueastrotalk/frontend/

# ✓ SAFE - Admin deployment (with excludes)
rsync -avz \
  --exclude 'node_modules' \
  --exclude 'public/uploads' \
  --exclude '.env' \
  admin/ server:/var/www/html/trueastrotalk/backend/

# ✗ DANGEROUS - Never use --delete on admin!
rsync -avz --delete admin/ server:/var/www/html/trueastrotalk/backend/  # DON'T DO THIS
```

### Verify Uploads Protection

```bash
# Check symlink
ls -la /var/www/html/trueastrotalk/backend/public/uploads

# Count files in shared uploads
find /var/www/html/trueastrotalk/shared/uploads -type f | wc -l

# Check permissions
ls -la /var/www/html/trueastrotalk/shared/uploads
```

### Emergency Commands

```bash
# Recreate symlink if broken
cd /var/www/html/trueastrotalk/backend/public
rm -rf uploads
ln -s /var/www/html/trueastrotalk/shared/uploads uploads

# Fix permissions
chown -R www-data:www-data /var/www/html/trueastrotalk/shared/uploads
chmod -R 755 /var/www/html/trueastrotalk/shared/uploads
```

---

## Summary

✅ **Do:**
- Use shared directory for uploads
- Create symlinks to shared uploads
- Exclude uploads in rsync commands
- Backup uploads daily
- Monitor disk usage
- Test restore procedures

❌ **Don't:**
- Use `--delete` flag with admin deployments
- Upload without exclude patterns
- Store uploads in deployment directory
- Forget to set up backups
- Assume uploads are safe

**Remember:** User data is irreplaceable. Always protect uploads!

---

## Updated .gitignore

Make sure your `.gitignore` includes:

```
# User uploads (never commit)
public/uploads/*
!public/uploads/.gitkeep

# Keep folder structure
!public/uploads/
```

This ensures you never accidentally commit user uploads to git.

---

**User uploads are now protected! 🔒**
