# Zero-Downtime Deployment Strategy

## Problem

Directly updating files and restarting PM2 causes:
- ❌ Service interruption (502 errors)
- ❌ Active user sessions disconnected
- ❌ In-progress API requests fail
- ❌ Socket connections drop

## Solution: Multi-Strategy Approach

We'll implement **4 strategies** working together:

1. **PM2 Cluster Mode** - Multiple instances with graceful reload
2. **Blue-Green Deployment** - Two separate environments
3. **Atomic Deployments** - Symlink switching
4. **Health Checks** - Verify before switching

---

## Strategy 1: PM2 Cluster Mode (Recommended - Easiest)

### How It Works

PM2 runs multiple instances of your app. During deployment:
1. PM2 restarts instances **one at a time**
2. Old instance serves requests while new one starts
3. Only switches after new instance is healthy
4. Zero downtime for users

### Implementation

#### 1.1 Update PM2 Ecosystem Configuration

Create `/var/www/html/trueastrotalk/backend/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'trueastrotalk-admin',
      script: './server.js',
      cwd: '/var/www/html/trueastrotalk/backend',

      // CLUSTER MODE - Run multiple instances
      instances: 2,  // Use 2 instances (can be 'max' for CPU cores)
      exec_mode: 'cluster',  // Changed from 'fork' to 'cluster'

      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },

      // Graceful reload settings
      kill_timeout: 5000,        // Wait 5s for graceful shutdown
      listen_timeout: 10000,     // Wait 10s for app to be ready
      wait_ready: true,          // Wait for app.listen() before considering ready

      // Health check
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,

      // Logging
      error_file: '/var/log/pm2/trueastrotalk-admin-error.log',
      out_file: '/var/log/pm2/trueastrotalk-admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'trueastrotalk-socket',
      script: './socket-server.js',
      cwd: '/var/www/html/trueastrotalk/backend',

      // Socket.IO with cluster mode needs special handling
      instances: 1,  // Keep at 1 for socket server (or use Redis adapter)
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 4002
      },

      kill_timeout: 5000,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      error_file: '/var/log/pm2/trueastrotalk-socket-error.log',
      out_file: '/var/log/pm2/trueastrotalk-socket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
```

#### 1.2 Update server.js for Graceful Shutdown

Update your `server.js` to handle graceful shutdown:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '4001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let server;

app.prepare().then(() => {
  server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);

    // Signal PM2 that app is ready
    if (process.send) {
      process.send('ready');
    }
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      console.log('HTTP server closed');

      // Close database connections
      // Add any cleanup here

      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // PM2 graceful reload
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      gracefulShutdown('PM2 shutdown');
    }
  });
});
```

#### 1.3 Deploy with Zero Downtime

```bash
# SSH into server
ssh root@your-server-ip

cd /var/www/html/trueastrotalk/backend

# Upload new code (via FTP/rsync - code is already uploaded)

# Install/update dependencies
npm install --production

# Graceful reload - NO DOWNTIME!
pm2 reload ecosystem.config.js

# Or reload specific app
pm2 reload trueastrotalk-admin
```

**What happens during `pm2 reload`:**
1. PM2 starts new instance with updated code
2. Waits for it to be ready (app.listen() called)
3. Routes new traffic to new instance
4. Sends SIGTERM to old instance
5. Old instance finishes current requests (up to 5s)
6. Old instance shuts down
7. Repeats for all instances

✅ **Zero downtime achieved!**

---

## Strategy 2: Blue-Green Deployment (Advanced)

### How It Works

Two complete environments:
- **Blue** = Current live production
- **Green** = New version being deployed

Deploy to Green, test, then switch traffic to Green instantly.

### Directory Structure

```
/var/www/html/trueastrotalk/
├── backend-blue/          # Current production
├── backend-green/         # New version
├── backend -> backend-blue  # Symlink (Apache points here)
└── frontend/              # Static files (instant update)
```

### Implementation

#### 2.1 Initial Setup (One-Time)

```bash
ssh root@your-server-ip

# Create blue-green structure
cd /var/www/html/trueastrotalk

# Rename current to blue
mv backend backend-blue

# Create green directory
mkdir backend-green

# Create symlink pointing to blue
ln -s backend-blue backend

# Verify
ls -la backend  # Should show: backend -> backend-blue
```

#### 2.2 Update Apache Config

Your Apache is already pointing to `backend/`, which is now a symlink - no change needed!

#### 2.3 Deployment Process

**Deploy to Green (new version):**

```bash
# 1. Upload new code to GREEN
rsync -avz --exclude 'node_modules' \
  /local/path/admin/ root@server:/var/www/html/trueastrotalk/backend-green/

# 2. SSH into server
ssh root@your-server-ip
cd /var/www/html/trueastrotalk/backend-green

# 3. Install dependencies
npm install --production

# 4. Copy environment file from blue
cp ../backend-blue/.env .env

# 5. Start GREEN on different port for testing
PORT=4003 pm2 start server.js --name trueastrotalk-admin-green

# 6. Test GREEN environment
curl http://localhost:4003/api/health
# Test all critical endpoints

# 7. If tests pass - SWITCH!
cd /var/www/html/trueastrotalk
rm backend  # Remove old symlink
ln -s backend-green backend  # Point to green

# 8. Reload PM2 with new path
pm2 reload ecosystem.config.js

# 9. Verify production is using GREEN
pm2 logs trueastrotalk-admin --lines 10

# 10. If everything works, stop old blue
pm2 delete trueastrotalk-admin-green
```

**Instant Rollback if Issues:**

```bash
# Switch back to BLUE immediately
cd /var/www/html/trueastrotalk
rm backend
ln -s backend-blue backend
pm2 reload ecosystem.config.js
```

✅ **Instant rollback in 5 seconds!**

---

## Strategy 3: Atomic Deployment Script (Automated)

### Create Deployment Script

Create `/var/www/html/trueastrotalk/deploy.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/html/trueastrotalk"
CURRENT_DIR="$APP_DIR/backend"
RELEASES_DIR="$APP_DIR/releases"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE="$RELEASES_DIR/$TIMESTAMP"
SHARED_DIR="$APP_DIR/shared"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to rollback
rollback() {
    print_error "Deployment failed. Rolling back..."

    if [ -L "$CURRENT_DIR" ]; then
        PREVIOUS=$(readlink "$CURRENT_DIR")
        print_status "Current symlink points to: $PREVIOUS"
    fi

    # Find previous release
    PREVIOUS_RELEASE=$(ls -t $RELEASES_DIR | head -2 | tail -1)

    if [ -n "$PREVIOUS_RELEASE" ]; then
        ln -sfn "$RELEASES_DIR/$PREVIOUS_RELEASE" "$CURRENT_DIR"
        print_status "Rolled back to: $PREVIOUS_RELEASE"
        pm2 reload ecosystem.config.js
        print_status "PM2 reloaded with previous release"
    else
        print_error "No previous release found to rollback to"
    fi

    exit 1
}

# Trap errors
trap rollback ERR

print_status "Starting deployment $TIMESTAMP"

# 1. Create release directory
print_status "Creating release directory: $NEW_RELEASE"
mkdir -p "$NEW_RELEASE"
mkdir -p "$SHARED_DIR/uploads"
mkdir -p "$SHARED_DIR/logs"

# 2. Upload new code (assumes code is in /tmp/new-release)
if [ ! -d "/tmp/new-release" ]; then
    print_error "New release code not found in /tmp/new-release"
    print_error "Please upload code first: rsync -avz admin/ server:/tmp/new-release/"
    exit 1
fi

print_status "Copying new code to release directory"
cp -r /tmp/new-release/* "$NEW_RELEASE/"

# 3. Link shared resources
print_status "Linking shared resources"
ln -sfn "$SHARED_DIR/uploads" "$NEW_RELEASE/public/uploads"
ln -sfn "$SHARED_DIR/.env" "$NEW_RELEASE/.env"

# 4. Install dependencies
print_status "Installing dependencies"
cd "$NEW_RELEASE"
npm install --production --silent

# 5. Build if needed
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    print_status "Building application"
    npm run build
fi

# 6. Health check (start on temporary port)
print_status "Starting health check on port 4003"
PORT=4003 NODE_ENV=production pm2 start server.js \
    --name "health-check-$TIMESTAMP" \
    --wait-ready \
    --listen-timeout 10000

# Wait for app to be ready
sleep 5

# Test health endpoint
print_status "Testing health endpoint"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4003/api/health || echo "000")

if [ "$HEALTH_CHECK" != "200" ]; then
    print_error "Health check failed with status: $HEALTH_CHECK"
    pm2 delete "health-check-$TIMESTAMP"
    rollback
fi

print_status "Health check passed!"
pm2 delete "health-check-$TIMESTAMP"

# 7. Switch symlink (atomic operation)
print_status "Switching to new release"
ln -sfn "$NEW_RELEASE" "$CURRENT_DIR"

# 8. Reload PM2
print_status "Reloading PM2"
pm2 reload ecosystem.config.js --update-env

# 9. Wait and verify
sleep 3
print_status "Verifying deployment"

if pm2 status | grep -q "trueastrotalk-admin.*online"; then
    print_status "✓ Deployment successful!"
    print_status "✓ New release: $TIMESTAMP"
    print_status "✓ Location: $NEW_RELEASE"
else
    print_error "PM2 apps not running properly"
    rollback
fi

# 10. Cleanup old releases (keep last 5)
print_status "Cleaning up old releases (keeping last 5)"
cd "$RELEASES_DIR"
ls -t | tail -n +6 | xargs -r rm -rf

# 11. Cleanup temp
rm -rf /tmp/new-release

print_status "Deployment complete! 🚀"
print_status "Active release: $TIMESTAMP"
```

Make it executable:

```bash
chmod +x /var/www/html/trueastrotalk/deploy.sh
```

### Usage

```bash
# On local machine - upload to temp location
rsync -avz --exclude 'node_modules' \
  admin/ root@server:/tmp/new-release/

# On server - run deployment script
ssh root@server
/var/www/html/trueastrotalk/deploy.sh
```

---

## Strategy 4: Frontend (Static Files) - No Downtime

### Cache Busting

Frontend already has cache-busting (Vite adds hashes to filenames), so:

```bash
# Simply overwrite files - users get new version on next page load
rsync -avz --delete frontend/dist/ root@server:/var/www/html/trueastrotalk/frontend/
```

**How it's zero-downtime:**
- Old files remain until rsync completes
- Hashed filenames mean old and new coexist
- Active users finish with old files
- New users get new files
- No 404 errors during upload

---

## Complete Deployment Workflow

### Initial Setup (One-Time)

```bash
# 1. SSH to server
ssh root@server

# 2. Create directory structure
mkdir -p /var/www/html/trueastrotalk/{releases,shared/uploads,shared/logs}

# 3. Move current backend to releases
mv /var/www/html/trueastrotalk/backend /var/www/html/trueastrotalk/releases/20250109_000000

# 4. Create symlink
ln -s /var/www/html/trueastrotalk/releases/20250109_000000 /var/www/html/trueastrotalk/backend

# 5. Move .env to shared
mv /var/www/html/trueastrotalk/releases/20250109_000000/.env /var/www/html/trueastrotalk/shared/.env
ln -s /var/www/html/trueastrotalk/shared/.env /var/www/html/trueastrotalk/releases/20250109_000000/.env

# 6. Update PM2 config to use cluster mode
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### Deploy New Version (Zero Downtime)

```bash
# LOCAL MACHINE

# 1. Build both apps
cd /path/to/trueastrotalk/frontend
npm run build

cd /path/to/trueastrotalk/admin
npm run build

# 2. Upload to temp location
rsync -avz --exclude 'node_modules' --exclude '.git' \
  admin/ root@server:/tmp/new-release/

rsync -avz --delete frontend/dist/ \
  root@server:/var/www/html/trueastrotalk/frontend/

# SERVER

# 3. SSH and deploy
ssh root@server
/var/www/html/trueastrotalk/deploy.sh

# 4. Monitor
pm2 logs --lines 50
```

---

## Rollback Procedure

### Quick Rollback (30 seconds)

```bash
ssh root@server

# See available releases
ls -lt /var/www/html/trueastrotalk/releases/

# Switch to previous release
cd /var/www/html/trueastrotalk
rm backend
ln -s releases/PREVIOUS_TIMESTAMP backend

# Reload PM2
pm2 reload ecosystem.config.js

# Verify
pm2 logs --lines 20
curl https://admin.trueastrotalk.com/api/health
```

---

## Database Migrations (Special Case)

### Safe Migration Strategy

```bash
# 1. Always make migrations backward-compatible
# Example: Adding new field
db.users.updateMany(
  { new_field: { $exists: false } },
  { $set: { new_field: null } }
)

# 2. Deploy code that works with BOTH old and new schema

# 3. Run migration

# 4. If rollback needed, old code still works

# 5. Later, remove old field support in next deployment
```

### Migration Checklist

- [ ] Migration is backward-compatible
- [ ] Tested in staging environment
- [ ] Backup database before running
- [ ] Run migration separately from code deploy
- [ ] Monitor for errors after migration

---

## Monitoring & Health Checks

### Add Health Check Endpoint

Create `/admin/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

export async function GET() {
  try {
    // Check database
    const health = await DatabaseService.healthCheck();

    if (health.status !== 'healthy') {
      return NextResponse.json({
        status: 'unhealthy',
        database: health.status,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
```

### Monitor During Deployment

```bash
# Watch health endpoint
watch -n 1 'curl -s https://admin.trueastrotalk.com/api/health | jq'

# Watch PM2 status
watch -n 1 'pm2 status'

# Watch logs
pm2 logs --lines 50 --timestamp
```

---

## Best Practices Checklist

- [ ] Use PM2 cluster mode (minimum 2 instances)
- [ ] Enable graceful reload
- [ ] Test in staging first
- [ ] Use atomic deployments (symlinks)
- [ ] Keep last 5 releases for quick rollback
- [ ] Health checks before switching
- [ ] Monitor logs during deployment
- [ ] Database migrations are backward-compatible
- [ ] Have rollback plan ready
- [ ] Deploy during low-traffic hours (optional)

---

## Summary: Recommended Setup

**For Your Case (Best Balance):**

1. **Use PM2 Cluster Mode** (Strategy 1)
   - Easiest to implement
   - Handles 99% of deployments
   - Zero downtime with `pm2 reload`

2. **Add Health Checks** (Strategy 4)
   - Verify app is healthy before routing traffic
   - Catch issues early

3. **Keep Releases Directory** (Strategy 3)
   - Quick rollback if needed
   - Deployment history

**Commands:**

```bash
# Setup (one-time)
pm2 delete all
pm2 start ecosystem.config.js  # with cluster mode
pm2 save

# Deploy (every time)
rsync -avz admin/ root@server:/var/www/html/trueastrotalk/backend/
ssh root@server "cd /var/www/html/trueastrotalk/backend && npm install --production && pm2 reload ecosystem.config.js"

# Rollback (if needed)
ssh root@server
pm2 restart ecosystem.config.js
# or switch to previous release if using symlinks
```

---

**Zero downtime achieved! 🎉**

Users can continue using your service while you deploy updates.
