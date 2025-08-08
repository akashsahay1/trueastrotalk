# True Astro Talk - Cross-Platform Environment Setup

This guide helps you set up the development environment consistently across Mac, Windows, and Linux.

## 🚀 Quick Setup

### 1. Initial Setup
```bash
# Clone and navigate to project
git clone <repository-url>
cd trueastrotalk

# Run setup script
./setup-environment.sh
```

### 2. Configure Environment
```bash
# Edit mobile app environment
nano mobile/.env

# Add your API keys and configuration
```

## 🔧 Manual Setup

### Mobile App Configuration

1. **Copy Environment Template**
```bash
cp mobile/.env.example mobile/.env
```

2. **Configure for Your Environment**

**For Mac/iOS Development:**
```env
APP_ENVIRONMENT=development
API_BASE_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000
```

**For Windows/Android Development:**
```env
APP_ENVIRONMENT=development  
API_BASE_URL=http://10.0.2.2:3000/api
SOCKET_URL=http://10.0.2.2:3000
```

**For Production:**
```env
APP_ENVIRONMENT=production
API_BASE_URL_PRODUCTION=https://www.trueastrotalk.com/api
SOCKET_URL_PRODUCTION=https://www.trueastrotalk.com
```

### Firebase Setup

#### Option 1: Secure Directory (Recommended)
```bash
# Create secure directory
mkdir -p ~/.trueastrotalk-secure

# Place Firebase files there
cp google-services.json ~/.trueastrotalk-secure/
cp GoogleService-Info.plist ~/.trueastrotalk-secure/

# Run setup script to create symlinks
./setup-environment.sh
```

#### Option 2: Direct Placement (Development Only)
```bash
# Android
cp google-services.json mobile/android/app/

# iOS  
cp GoogleService-Info.plist mobile/ios/Runner/
```

## 🌐 API Configuration

### Local Development Server
```bash
# Start admin/API server
cd admin
npm run dev
```

### Environment-Based URLs

The app automatically detects the environment and platform:

| Environment | Platform | URL |
|------------|----------|-----|
| Development | iOS/Mac | `http://localhost:3000/api` |
| Development | Android | `http://10.0.2.2:3000/api` |
| Production | All | `https://www.trueastrotalk.com/api` |

## 📱 Platform-Specific Issues

### Windows + Android Studio + Localhost

**Problem:** Android emulator can't access `localhost:3000`
**Solution:** Set `APP_ENVIRONMENT=development` in `.env` - the app automatically uses `10.0.2.2:3000`

### Mac + iOS Simulator + Localhost

**Problem:** iOS simulator should use localhost
**Solution:** Set `APP_ENVIRONMENT=development` in `.env` - the app uses `localhost:3000`

## 🔐 Security Best Practices

### Sensitive Files Management

**Never Commit:**
- `google-services.json`
- `GoogleService-Info.plist`
- `.env` files (except `.env.example`)
- API keys
- Database credentials

**Secure Storage Options:**

1. **Home Directory** (Recommended)
```bash
~/.trueastrotalk-secure/
├── google-services.json
├── GoogleService-Info.plist
└── admin.env
```

2. **External Drive/Cloud** (Team Sharing)
- Store files in secure cloud storage
- Share access with team members
- Sync to local secure directory

3. **Environment Variables** (CI/CD)
```bash
export FIREBASE_PROJECT_ID=your_project_id
export FIREBASE_API_KEY=your_api_key
```

## 🔄 Syncing Between Machines

### Initial Setup on New Machine
```bash
# 1. Clone repository
git clone <repository-url>
cd trueastrotalk

# 2. Run setup
./setup-environment.sh

# 3. Get sensitive files from secure location
# (cloud storage, previous machine, team lead, etc.)

# 4. Place in secure directory
cp path/to/google-services.json ~/.trueastrotalk-secure/
cp path/to/GoogleService-Info.plist ~/.trueastrotalk-secure/

# 5. Configure environment
cp mobile/.env.example mobile/.env
# Edit mobile/.env with your settings

# 6. Install dependencies
cd mobile && flutter pub get
cd ../admin && npm install
```

### Regular Development Workflow
```bash
# Pull latest code
git pull origin main

# No need to reconfigure environment files!
# They're symlinked from secure directory

# Install new dependencies if pubspec.yaml changed
cd mobile && flutter pub get
cd ../admin && npm install
```

## 🚨 Troubleshooting

### "Connection Refused" Errors
1. Check if local server is running: `curl http://localhost:3000`
2. For Android: Try `http://10.0.2.2:3000`
3. Check firewall settings

### Flutter "Asset Not Found" Errors
1. Ensure `.env` is in `pubspec.yaml` assets
2. Run `flutter clean && flutter pub get`

### Firebase Initialization Errors
1. Check if `google-services.json` exists in correct location
2. Verify Firebase configuration in files
3. Ensure bundle/package IDs match

## 📋 Environment Checklist

**Before Starting Development:**
- [ ] `.env` file configured
- [ ] Firebase files in place  
- [ ] Local server can start
- [ ] Mobile app can connect to API
- [ ] Firebase initialization works
- [ ] No sensitive files in git status

**Before Switching Machines:**
- [ ] Sensitive files backed up securely
- [ ] Environment configurations documented
- [ ] Team has access to shared secure storage

## 🔧 Advanced Configuration

### Custom Environment Variables
Add to `mobile/.env`:
```env
# Custom API endpoints
CUSTOM_SERVICE_URL=https://api.example.com
ANALYTICS_ENABLED=true
DEBUG_NETWORK=true

# Feature flags
ENABLE_NEW_FEATURE=false
```

Access in code:
```dart
import 'package:trueastrotalk/config/environment_config.dart';

String customUrl = dotenv.env['CUSTOM_SERVICE_URL'] ?? '';
bool debugNetwork = dotenv.env['DEBUG_NETWORK'] == 'true';
```

### Multiple Environments
Create separate .env files:
```bash
mobile/.env.development
mobile/.env.staging  
mobile/.env.production
```

This system ensures consistent development experience across all platforms while keeping sensitive data secure! 🚀