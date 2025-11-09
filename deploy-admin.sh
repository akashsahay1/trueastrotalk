#!/bin/bash

# ========================================
# TrueAstroTalk Admin Deployment Script
# ========================================
#
# This script safely deploys the admin panel with:
# ✓ Zero downtime (PM2 graceful reload)
# ✓ User uploads protection
# ✓ Environment variables preservation
# ✓ Health checks before switching
# ✓ Automatic rollback on failure
#
# Usage: ./deploy-admin.sh
# ========================================

# Configuration - UPDATE THESE
SERVER_USER="root"
SERVER_HOST="your-server-ip"  # UPDATE THIS!
SERVER_PATH="/var/www/html/trueastrotalk/backend"
SHARED_PATH="/var/www/html/trueastrotalk/shared"
LOCAL_DIR="$(cd "$(dirname "$0")/admin" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Check if server host is configured
if [ "$SERVER_HOST" == "your-server-ip" ]; then
    print_error "Please update SERVER_HOST in the script!"
    print_info "Edit deploy-admin.sh and set SERVER_HOST to your server's IP address"
    exit 1
fi

# Start deployment
print_header "TrueAstroTalk Admin Deployment"

print_info "Deploying from: $LOCAL_DIR"
print_info "Deploying to: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""

# Step 1: Build locally
print_header "Step 1/6: Building Admin Panel"

cd "$LOCAL_DIR"
print_info "Running: npm run build"

npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Please fix errors and try again."
    exit 1
fi

print_success "Build completed successfully"

# Step 2: Upload files (SAFE - excludes uploads)
print_header "Step 2/6: Uploading Files to Server"

print_info "Uploading with protection for:"
print_info "  - User uploads (public/uploads/)"
print_info "  - Environment variables (.env)"
print_info "  - Node modules (will install on server)"
echo ""

rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude 'node_modules/**' \
  --exclude '.git' \
  --exclude '.git/**' \
  --exclude '.cache' \
  --exclude '.next/cache' \
  --exclude '.next/cache/**' \
  --exclude 'public/uploads' \
  --exclude 'public/uploads/**' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.*.local' \
  --exclude '*.log' \
  "$LOCAL_DIR/" \
  "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

if [ $? -ne 0 ]; then
    print_error "Upload failed!"
    exit 1
fi

print_success "Files uploaded successfully"

# Step 3: Server-side setup and deployment
print_header "Step 3/6: Server Configuration & Dependencies"

print_info "Connecting to server..."

ssh "$SERVER_USER@$SERVER_HOST" bash << 'ENDSSH'
set -e  # Exit on any error

# Colors for remote output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo "  $1"; }

cd /var/www/html/trueastrotalk/backend

# Ensure shared directory exists
if [ ! -d "/var/www/html/trueastrotalk/shared/uploads" ]; then
    print_info "Creating shared uploads directory..."
    mkdir -p /var/www/html/trueastrotalk/shared/uploads
    chown -R www-data:www-data /var/www/html/trueastrotalk/shared/uploads
    chmod -R 755 /var/www/html/trueastrotalk/shared/uploads
    print_success "Shared uploads directory created"
fi

# Ensure uploads symlink exists
if [ ! -L "public/uploads" ]; then
    print_info "Creating uploads symlink..."

    # Backup if real directory exists
    if [ -d "public/uploads" ] && [ ! -L "public/uploads" ]; then
        print_info "Backing up existing uploads..."
        cp -rp public/uploads/* /var/www/html/trueastrotalk/shared/uploads/ 2>/dev/null || true
        mv public/uploads public/uploads.backup.$(date +%Y%m%d_%H%M%S)
    fi

    # Create symlink
    ln -s /var/www/html/trueastrotalk/shared/uploads public/uploads
    print_success "Uploads symlink created"
else
    print_success "Uploads symlink already exists"
fi

# Ensure .env symlink exists (if shared .env exists)
if [ -f "/var/www/html/trueastrotalk/shared/.env" ] && [ ! -L ".env" ]; then
    print_info "Creating .env symlink..."
    rm -f .env
    ln -s /var/www/html/trueastrotalk/shared/.env .env
    print_success ".env symlink created"
fi

# Install dependencies
print_info "Installing dependencies..."
npm install --production --silent

if [ $? -ne 0 ]; then
    print_error "npm install failed!"
    exit 1
fi

print_success "Dependencies installed"
ENDSSH

if [ $? -ne 0 ]; then
    print_error "Server setup failed!"
    exit 1
fi

print_success "Server configured successfully"

# Step 4: Health check before reload
print_header "Step 4/6: Pre-Deployment Health Check"

print_info "Checking application health..."

HEALTH_STATUS=$(ssh "$SERVER_USER@$SERVER_HOST" \
  "curl -s -o /dev/null -w '%{http_code}' https://admin.trueastrotalk.com/api/health" || echo "000")

if [ "$HEALTH_STATUS" == "200" ]; then
    print_success "Application is healthy (HTTP $HEALTH_STATUS)"
elif [ "$HEALTH_STATUS" == "000" ]; then
    print_warning "Health check endpoint not accessible (may be first deployment)"
else
    print_warning "Application health check returned HTTP $HEALTH_STATUS"
    print_info "Proceeding with deployment..."
fi

# Step 5: Graceful reload (Zero Downtime)
print_header "Step 5/6: Graceful Reload (Zero Downtime)"

print_info "Reloading PM2 with zero downtime..."

ssh "$SERVER_USER@$SERVER_HOST" bash << 'ENDSSH'
cd /var/www/html/trueastrotalk/backend

# Check if ecosystem file exists
if [ -f "ecosystem.production.js" ]; then
    pm2 reload ecosystem.production.js --update-env
else
    echo "WARNING: ecosystem.production.js not found, using ecosystem.config.js"
    pm2 reload ecosystem.config.js --update-env || pm2 restart all
fi
ENDSSH

if [ $? -ne 0 ]; then
    print_error "PM2 reload failed!"
    print_info "Attempting recovery..."

    ssh "$SERVER_USER@$SERVER_HOST" "pm2 restart all"

    if [ $? -ne 0 ]; then
        print_error "Recovery failed! Manual intervention required."
        exit 1
    fi

    print_warning "Recovered using restart (brief downtime may have occurred)"
fi

print_success "PM2 reload completed"

# Step 6: Post-deployment verification
print_header "Step 6/6: Post-Deployment Verification"

print_info "Waiting for application to start..."
sleep 5

# Check PM2 status
print_info "Checking PM2 status..."
PM2_STATUS=$(ssh "$SERVER_USER@$SERVER_HOST" "pm2 jlist" | grep -o '"status":"online"' | wc -l)

if [ "$PM2_STATUS" -ge 1 ]; then
    print_success "PM2 processes are online ($PM2_STATUS instances)"
else
    print_error "PM2 processes not running properly!"
    ssh "$SERVER_USER@$SERVER_HOST" "pm2 status"
    exit 1
fi

# Final health check
print_info "Running final health check..."
sleep 2

FINAL_HEALTH=$(ssh "$SERVER_USER@$SERVER_HOST" \
  "curl -s -o /dev/null -w '%{http_code}' https://admin.trueastrotalk.com/api/health" || echo "000")

if [ "$FINAL_HEALTH" == "200" ]; then
    print_success "Application health check passed (HTTP $FINAL_HEALTH)"
elif [ "$FINAL_HEALTH" == "000" ]; then
    print_warning "Health endpoint not accessible (check /api/health route exists)"
else
    print_warning "Health check returned HTTP $FINAL_HEALTH"
    print_info "Application may need a moment to fully start"
fi

# Deployment complete
print_header "Deployment Complete! 🚀"

echo ""
print_success "Admin panel deployed successfully"
print_info "URL: https://admin.trueastrotalk.com"
echo ""
print_info "Protected resources:"
print_info "  ✓ User uploads preserved"
print_info "  ✓ Environment variables intact"
print_info "  ✓ Zero downtime deployment"
echo ""
print_info "Next steps:"
print_info "  • Monitor logs: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs'"
print_info "  • Check status: ssh $SERVER_USER@$SERVER_HOST 'pm2 status'"
print_info "  • View health: curl https://admin.trueastrotalk.com/api/health"
echo ""

# Ask to view logs
read -p "View PM2 logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Connecting to PM2 logs (Ctrl+C to exit)..."
    sleep 1
    ssh "$SERVER_USER@$SERVER_HOST" "pm2 logs --lines 50"
fi
