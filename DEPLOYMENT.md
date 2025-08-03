# 🚀 True Astrotalk Production Deployment Guide

## Prerequisites
- Production server with Node.js 18+ installed
- MongoDB instance running
- Domain name configured (www.trueastrotalk.com)
- SSL certificate (optional but recommended)

## 1. Server Preparation

```bash
# Update server packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install MongoDB (if not already installed)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 2. Code Deployment

```bash
# Clone repository to production server
git clone https://github.com/akashsahay1/trueastrotalk.git
cd trueastrotalk

# Or pull latest changes if already cloned
git pull origin main

# Navigate to admin directory
cd admin

# Install dependencies
npm install --production

# Copy environment configuration
cp .env.production .env.local

# Edit environment variables (IMPORTANT!)
nano .env.local
```

## 3. Environment Configuration

Update `.env.local` with your production values:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/trueastrotalkDB

# JWT Configuration (GENERATE STRONG RANDOM KEYS!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-nextauth-key
NEXTAUTH_URL=https://www.trueastrotalk.com

# Production Mode
NODE_ENV=production
```

## 4. Database Setup

```bash
# Run database update script
node scripts/update-production-db.js

# Verify database connection
mongosh trueastrotalkDB --eval "db.users.countDocuments()"
```

## 5. Build and Start Application

```bash
# Build Next.js application
npm run build

# Create uploads directory
mkdir -p public/uploads/profile-images
chmod 755 public/uploads
chmod 755 public/uploads/profile-images

# Start with PM2
pm2 start server.js --name "trueastrotalk-admin" --env production
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs trueastrotalk-admin
```

## 6. Nginx Configuration (Optional)

If using Nginx as reverse proxy:

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/trueastrotalk
sudo ln -s /etc/nginx/sites-available/trueastrotalk /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL Setup (Recommended)

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d www.trueastrotalk.com -d trueastrotalk.com
```

## 8. Verification Checklist

- [ ] Server is running on port 3000
- [ ] MongoDB is connected and accessible  
- [ ] Environment variables are set correctly
- [ ] File uploads directory has proper permissions
- [ ] SSL certificate is installed (if using HTTPS)
- [ ] Image upload functionality works
- [ ] Database indexes are created
- [ ] PM2 is managing the process

## 9. Mobile App Configuration

Update mobile app to use production APIs:

1. Change `Config.mode` to `'prod'` in `mobile/lib/config/config.dart`
2. Rebuild and release mobile app

## 10. Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs trueastrotalk-admin

# Monitor system resources
pm2 monit

# Restart if needed
pm2 restart trueastrotalk-admin
```

## 11. Backup Strategy

```bash
# Create database backup
mongodump --db trueastrotalkDB --out /backup/mongodb/$(date +%Y%m%d)

# Backup uploaded files
tar -czf /backup/uploads/uploads-$(date +%Y%m%d).tar.gz public/uploads/
```

## Troubleshooting

### Common Issues:

1. **Port 3000 already in use**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Permission denied for uploads**
   ```bash
   sudo chown -R $USER:$USER public/uploads
   chmod -R 755 public/uploads
   ```

3. **MongoDB connection failed**
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

4. **Environment variables not loaded**
   ```bash
   pm2 restart trueastrotalk-admin --update-env
   ```

## Security Considerations

- [ ] Strong JWT secrets generated
- [ ] MongoDB secured with authentication
- [ ] File upload validation in place
- [ ] HTTPS enabled
- [ ] Server firewall configured
- [ ] Regular security updates applied

## Performance Optimization

- [ ] Enable gzip compression in Nginx
- [ ] Set up CDN for static assets
- [ ] Configure proper caching headers
- [ ] Monitor memory usage and optimize
- [ ] Set up log rotation

For support, contact the development team or check the repository issues.