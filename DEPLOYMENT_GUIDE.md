# TrueAstrotalk Deployment Guide

## Overview

This guide covers deploying both applications to your VPS:
- **Frontend** (React/Vite) → `trueastrotalk.com`
- **Admin Panel** (Next.js) → `admin.trueastrotalk.com`

Your current server setup:
- Apache2 with SSL certificates
- Node.js 23.6.0
- PM2 process manager
- MongoDB running locally

---

## Pre-Deployment Checklist

- [x] Frontend built successfully (`/frontend/dist`)
- [x] Admin built successfully (`/admin/.next`)
- [ ] Environment variables prepared
- [ ] MongoDB accessible from server
- [ ] FTP client installed (FileZilla recommended)

---

## Part 1: Deploy Frontend (Static Site)

### 1.1 Upload Files via FTP

**Upload Location:** `/var/www/html/trueastrotalk/frontend`

**Files to Upload:** Everything from `frontend/dist/`

**FTP Instructions:**
```
Local Path:  /Volumes/Projects/Projects/Trueastrotalk/trueastrotalk/frontend/dist/*
Remote Path: /var/www/html/trueastrotalk/frontend/
```

**Using FileZilla:**
1. Connect to your server using FTP/SFTP credentials
2. Navigate to `/var/www/html/trueastrotalk/frontend/`
3. **Delete all existing files** in this directory first
4. Upload all files from `frontend/dist/` to this directory
5. Ensure file permissions are set correctly (644 for files, 755 for directories)

**Using Command Line (if you have SSH):**
```bash
# From your local machine
cd /Volumes/Projects/Projects/Trueastrotalk/trueastrotalk/frontend

# --delete is SAFE for frontend (no user uploads)
rsync -avz --delete dist/ root@your-server-ip:/var/www/html/trueastrotalk/frontend/
```

### 1.2 Verify Frontend Deployment

Visit `https://trueastrotalk.com` - you should see your React app.

---

## Part 2: Deploy Admin Panel (Next.js Application)

### 2.1 Prepare Admin for Upload

**Upload Location:** `/var/www/html/trueastrotalk/backend` (or create a new directory like `/var/www/html/trueastrotalk/admin`)

**Files to Upload:**
- All source files (`src/`, `public/`)
- Configuration files (`package.json`, `tsconfig.json`, `next.config.ts`)
- Build output (`.next/`)
- Additional files (`server.js`, `socket-server.js`, `.env`)

**DO NOT Upload:**
- `node_modules/` (will install on server)
- `.git/` (not needed)
- `.cache/` or other temporary files

### 2.2 Upload Admin Files

**Option A: Using FTP/SFTP**

Upload these directories and files:
```
Local                                    → Remote
/admin/src                              → /var/www/html/trueastrotalk/backend/src
/admin/public                           → /var/www/html/trueastrotalk/backend/public
/admin/.next                            → /var/www/html/trueastrotalk/backend/.next
/admin/package.json                     → /var/www/html/trueastrotalk/backend/package.json
/admin/package-lock.json                → /var/www/html/trueastrotalk/backend/package-lock.json
/admin/tsconfig.json                    → /var/www/html/trueastrotalk/backend/tsconfig.json
/admin/next.config.ts                   → /var/www/html/trueastrotalk/backend/next.config.ts
/admin/tailwind.config.ts               → /var/www/html/trueastrotalk/backend/tailwind.config.ts
/admin/postcss.config.js                → /var/www/html/trueastrotalk/backend/postcss.config.js
/admin/server.js                        → /var/www/html/trueastrotalk/backend/server.js
/admin/socket-server.js                 → /var/www/html/trueastrotalk/backend/socket-server.js
/admin/.env                             → /var/www/html/trueastrotalk/backend/.env
```

**Option B: Using rsync (if you have SSH access):**
```bash
# From your local machine
cd /Volumes/Projects/Projects/Trueastrotalk/trueastrotalk/admin

# IMPORTANT: NEVER use --delete flag for admin!
# User uploads in public/uploads/ must be protected!

# Upload necessary files (SAFE - excludes user uploads)
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.cache' \
  --exclude '.next/cache' \
  --exclude 'public/uploads' \
  --exclude 'public/uploads/*' \
  --exclude '.env' \
  ./ root@your-server-ip:/var/www/html/trueastrotalk/backend/
```

**⚠️ CRITICAL WARNING:**
```bash
# ❌ NEVER DO THIS - Deletes all user uploads!
rsync -avz --delete admin/ root@server:/var/www/html/trueastrotalk/backend/

# ✅ ALWAYS DO THIS - Excludes uploads
rsync -avz --exclude 'public/uploads' admin/ root@server:/var/www/html/trueastrotalk/backend/
```

### 2.3 Protect User Uploads (CRITICAL - One-Time Setup)

Before continuing, you MUST protect user uploads from being deleted during deployments.

**SSH into server:**
```bash
ssh root@your-server-ip
cd /var/www/html/trueastrotalk

# Create shared directory for permanent data
mkdir -p shared/uploads
mkdir -p shared/logs

# Move existing uploads to shared (if any)
if [ -d "backend/public/uploads" ]; then
  echo "Protecting existing uploads..."
  cp -rp backend/public/uploads/* shared/uploads/ 2>/dev/null || true
  mv backend/public/uploads backend/public/uploads.backup
fi

# Create symlink from deployment to shared uploads
ln -s /var/www/html/trueastrotalk/shared/uploads backend/public/uploads

# Set permissions
chown -R www-data:www-data shared/uploads
chmod -R 755 shared/uploads

# Verify
ls -la backend/public/uploads  # Should show symlink
echo "✓ User uploads are now protected!"
```

**Optional: Move .env to shared location too:**
```bash
mv backend/.env shared/.env
ln -s /var/www/html/trueastrotalk/shared/.env backend/.env
chmod 600 shared/.env
```

**Why this is critical:**
- User uploads contain profile images, documents, media files
- These are irreplaceable user data
- Deploying without this protection could delete all uploads!
- See `UPLOADS_PROTECTION.md` for full details

### 2.4 Install Dependencies on Server

**SSH into your server:**
```bash
ssh root@your-server-ip
```

**Navigate to admin directory and install:**
```bash
cd /var/www/html/trueastrotalk/backend
npm install --production
```

This will install all required packages from `package.json`.

---

## Part 3: Configure Environment Variables

### 3.1 Update .env File on Server

**SSH into server:**
```bash
ssh root@your-server-ip
cd /var/www/html/trueastrotalk/backend
nano .env
```

**Important: Update these values for production:**

```env
# Database - Update if MongoDB is on different host
MONGODB_URL=mongodb://localhost:27017
DB_NAME=trueastrotalkDB

# Keep JWT secrets (DO NOT share these)
JWT_SECRET=your-existing-secret
JWT_REFRESH_SECRET=your-existing-refresh-secret
NEXTAUTH_SECRET=your-existing-secret
SESSION_SECRET=your-existing-secret
ENCRYPTION_PASSWORD=your-existing-password

# Server ports (must match PM2 config)
PORT=4001
SOCKET_PORT=4002

# File uploads - use absolute path
UPLOAD_DIR=/var/www/html/trueastrotalk/backend/public/uploads
MAX_FILE_SIZE=5242880

# Payment - UPDATE TO PRODUCTION KEYS
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your-live-secret

# Email - Verify SendGrid key is production key
SEND_FROM=info@trueastrotalk.com
SENDGRID_API_KEY=your-production-key

# Firebase - Keep existing credentials

# Business config
DEFAULT_COMMISSION_RATE=0.25
MINIMUM_PAYOUT_THRESHOLD=1000
```

**Save and exit** (`Ctrl+X`, then `Y`, then `Enter`)

---

## Part 4: Configure PM2

### 4.1 Stop Existing PM2 Processes

```bash
pm2 stop trueastrotalk-backend
pm2 stop trueastrotalk-socket
pm2 delete trueastrotalk-backend
pm2 delete trueastrotalk-socket
```

### 4.2 Create PM2 Ecosystem File

Create a file called `ecosystem.config.js`:

```bash
cd /var/www/html/trueastrotalk/backend
nano ecosystem.config.js
```

**Add this configuration:**

```javascript
module.exports = {
  apps: [
    {
      name: 'trueastrotalk-admin',
      script: './server.js',
      cwd: '/var/www/html/trueastrotalk/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },
      error_file: '/var/log/pm2/trueastrotalk-admin-error.log',
      out_file: '/var/log/pm2/trueastrotalk-admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'trueastrotalk-socket',
      script: './socket-server.js',
      cwd: '/var/www/html/trueastrotalk/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 4002
      },
      error_file: '/var/log/pm2/trueastrotalk-socket-error.log',
      out_file: '/var/log/pm2/trueastrotalk-socket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M'
    }
  ]
};
```

**Save and exit**

### 4.3 Start Applications with PM2

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 to start on system boot
pm2 startup
```

### 4.4 Verify PM2 Status

```bash
pm2 status
```

You should see:
```
┌────┬──────────────────────────┬─────────┬─────────┬──────────┬────────┐
│ id │ name                     │ status  │ cpu     │ mem      │ uptime │
├────┼──────────────────────────┼─────────┼─────────┼──────────┼────────┤
│ 0  │ trueastrotalk-admin      │ online  │ 0%      │ 95.0mb   │ 0s     │
│ 1  │ trueastrotalk-socket     │ online  │ 0%      │ 87.0mb   │ 0s     │
└────┴──────────────────────────┴─────────┴─────────┴──────────┴────────┘
```

### 4.5 View Logs

```bash
# View admin logs
pm2 logs trueastrotalk-admin

# View socket logs
pm2 logs trueastrotalk-socket

# View all logs
pm2 logs

# Clear logs
pm2 flush
```

---

## Part 5: Apache Configuration (Already Done)

Your Apache config is already set up correctly:

- **Frontend:** Serves static files from `/var/www/html/trueastrotalk/frontend`
- **Admin:** Proxies to `localhost:4001` and `localhost:4002` for socket

**No changes needed**, but if you want to verify:

```bash
# Test Apache configuration
sudo apachectl configtest

# Restart Apache if needed
sudo systemctl restart apache2
```

---

## Part 6: Post-Deployment Verification

### 6.1 Test Frontend

1. Visit `https://trueastrotalk.com`
2. Check all pages load correctly
3. Verify images and assets load
4. Test navigation and forms

### 6.2 Test Admin Panel

1. Visit `https://admin.trueastrotalk.com`
2. Try logging in
3. Check API endpoints work
4. Verify database connections
5. Test socket connections (real-time features)

### 6.3 Check Logs

```bash
# PM2 logs
pm2 logs --lines 100

# Apache logs
tail -f /var/log/apache2/trueastrotalk_error.log
tail -f /var/log/apache2/trueastrotalkadmin_error.log
```

### 6.4 Monitor Server Resources

```bash
# Check memory usage
free -h

# Check disk space
df -h

# Check running processes
pm2 status
htop  # if installed
```

---

## Part 7: Troubleshooting

### Issue: Frontend not loading

**Check:**
1. Files uploaded correctly to `/var/www/html/trueastrotalk/frontend`
2. Apache has read permissions: `ls -la /var/www/html/trueastrotalk/frontend`
3. Check Apache logs: `tail -f /var/log/apache2/trueastrotalk_error.log`

### Issue: Admin panel shows 502 Bad Gateway

**Check:**
1. PM2 apps are running: `pm2 status`
2. Apps listening on correct ports: `netstat -tulpn | grep -E '4001|4002'`
3. Check PM2 logs: `pm2 logs`
4. Restart apps: `pm2 restart all`

### Issue: Database connection errors

**Check:**
1. MongoDB is running: `sudo systemctl status mongod`
2. .env has correct MONGODB_URL
3. MongoDB accessible: `mongosh --eval "db.adminCommand('ping')"`

### Issue: Environment variables not loaded

**Check:**
1. .env file exists: `ls -la /var/www/html/trueastrotalk/backend/.env`
2. File permissions: `chmod 600 /var/www/html/trueastrotalk/backend/.env`
3. Restart PM2: `pm2 restart all`

### Issue: Socket connections failing

**Check:**
1. Socket server running on port 4002: `netstat -tulpn | grep 4002`
2. Apache proxy config correct
3. No firewall blocking: `sudo ufw status`

---

## Part 8: Updating the Application

### 8.1 Update Frontend

```bash
# On local machine - rebuild
cd /Volumes/Projects/Projects/Trueastrotalk/trueastrotalk/frontend
npm run build

# Upload via FTP or rsync
rsync -avz --delete dist/ root@your-server-ip:/var/www/html/trueastrotalk/frontend/
```

### 8.2 Update Admin Panel

```bash
# On local machine - rebuild
cd /Volumes/Projects/Projects/Trueastrotalk/trueastrotalk/admin
npm run build

# Upload changed files via FTP or rsync (PROTECTED - won't touch uploads)
rsync -avz \
  --exclude 'node_modules' \
  --exclude 'public/uploads' \
  --exclude '.env' \
  ./ root@your-server-ip:/var/www/html/trueastrotalk/backend/

# On server - graceful reload (zero downtime)
ssh root@your-server-ip
cd /var/www/html/trueastrotalk/backend
npm install --production  # if package.json changed
pm2 reload ecosystem.production.js  # Zero downtime reload
```

**Important Files Protected:**
- ✅ `public/uploads/` - User uploads preserved
- ✅ `.env` - Environment variables safe (if using shared)
- ✅ Zero downtime with `pm2 reload`

---

## Part 9: Security & Data Protection Checklist

### Security
- [ ] .env file has 600 permissions (not readable by others)
- [ ] Production Razorpay keys configured (not test keys)
- [ ] Production SendGrid API key configured
- [ ] JWT secrets are strong and unique
- [ ] MongoDB has authentication enabled
- [ ] Firewall allows only necessary ports (80, 443, SSH)
- [ ] SSL certificates are valid and auto-renewing
- [ ] PM2 logs being monitored

### Data Protection (CRITICAL)
- [ ] **User uploads protected** (using shared directory + symlink)
- [ ] **Never use --delete flag** when deploying admin
- [ ] **Rsync excludes public/uploads** in all deployment commands
- [ ] **Daily backups configured** for uploads directory
- [ ] **Tested restore procedure** for uploads
- [ ] **Database backups** running automatically
- [ ] **Disk space monitoring** set up for uploads
- [ ] **Read UPLOADS_PROTECTION.md** thoroughly

---

## Quick Reference Commands

```bash
# PM2 Management
pm2 status                    # Check app status
pm2 restart all              # Restart all apps
pm2 stop all                 # Stop all apps
pm2 logs                     # View logs
pm2 monit                    # Monitor resources

# Apache Management
sudo systemctl status apache2
sudo systemctl restart apache2
sudo apachectl configtest

# MongoDB Management
sudo systemctl status mongod
mongosh                      # Connect to MongoDB

# File Permissions
sudo chown -R www-data:www-data /var/www/html/trueastrotalk
sudo chmod -R 755 /var/www/html/trueastrotalk/frontend
sudo chmod -R 750 /var/www/html/trueastrotalk/backend
sudo chmod 600 /var/www/html/trueastrotalk/backend/.env
```

---

## Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs`
2. Check Apache logs: `tail -f /var/log/apache2/*error.log`
3. Verify environment variables
4. Ensure all services are running
5. Check firewall rules

---

**Deployment Date:** `date`
**Node.js Version:** 23.6.0
**PM2 Version:** Check with `pm2 --version`

---

Good luck with your deployment! 🚀
