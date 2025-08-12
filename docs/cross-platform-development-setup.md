# Cross-Platform Development Setup Guide

## Environment Consistency Across Mac/Windows

### Prerequisites
- Flutter SDK (latest stable)
- Node.js (v18+)
- Git configured with your credentials

### Step 1: Clone and Initial Setup

```bash
git clone <repository-url>
cd trueastrotalk
```

### Step 2: Environment Configuration

#### Mobile App (.env file)
Create `mobile/.env` (never commit this file):

```env
# App Environment
APP_ENVIRONMENT=development

# API Configuration
API_BASE_URL=http://localhost:3000/api
SOCKET_URL=http://localhost:3000

# Production URLs (when deploying)
API_BASE_URL_PRODUCTION=https://your-domain.com/api
SOCKET_URL_PRODUCTION=https://your-domain.com

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_APP_ID_ANDROID=your-android-app-id
FIREBASE_APP_ID_IOS=your-ios-app-id
FIREBASE_API_KEY_ANDROID=your-android-api-key
FIREBASE_API_KEY_IOS=your-ios-api-key
FIREBASE_SENDER_ID=your-sender-id

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id

# Debug Settings
ENABLE_NETWORK_LOGGING=true
```

#### Admin Panel (.env.local file)
Create `admin/.env.local` (never commit this file):

```env
# Database
MONGODB_URI=mongodb://localhost:27017/trueastrotalkDB
# Or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/trueastrotalkDB

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000

# RazorPay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email Service
SENDGRID_API_KEY=your_sendgrid_key

# SMS Service  
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### Step 3: Firebase Configuration Files

#### Android: `mobile/android/app/google-services.json`
1. Go to Firebase Console → Project Settings
2. Add Android app with package name: `com.trueastrotalk.user`
3. Download google-services.json
4. Place in `mobile/android/app/` directory

#### iOS: `mobile/ios/Runner/GoogleService-Info.plist`  
1. Go to Firebase Console → Project Settings
2. Add iOS app with bundle ID: `com.trueastrotalk.user`
3. Download GoogleService-Info.plist
4. Place in `mobile/ios/Runner/` directory

### Step 4: Platform-Specific Setup

#### Mac Setup
```bash
# Install dependencies
cd admin && npm install
cd ../mobile && flutter pub get
cd ../mobile/ios && pod install
```

#### Windows Setup
```bash
# Install dependencies
cd admin && npm install
cd ../mobile && flutter pub get
# iOS not available on Windows
```

### Step 5: Running the Application

#### Start Admin Panel (Both Mac/Windows)
```bash
cd admin
npm run dev
# Server runs on http://localhost:3000
```

#### Start Mobile App

**iOS (Mac only):**
```bash
cd mobile
flutter run -d ios
```

**Android (Mac/Windows):**
```bash
cd mobile
flutter run -d android
```

### Android Emulator Localhost Access

The app automatically handles localhost access:
- **iOS Simulator**: Uses `localhost:3000`
- **Android Emulator**: Automatically converts to `10.0.2.2:3000`
- **Physical Devices**: Use your computer's IP address

To find your IP address:
```bash
# Mac/Linux
ifconfig | grep inet
# Windows
ipconfig
```

Then update your .env file:
```env
API_BASE_URL=http://192.168.1.100:3000/api
SOCKET_URL=http://192.168.1.100:3000
```

### File Synchronization Between Machines

#### What NOT to commit:
- `mobile/.env`
- `admin/.env.local`
- `mobile/android/app/google-services.json`
- `mobile/ios/Runner/GoogleService-Info.plist`

#### Sharing sensitive files securely:
1. **Use encrypted file sharing** (1Password, Bitwarden, etc.)
2. **Team shared vault** in password manager
3. **Encrypted USB drive** for offline transfer
4. **Secure team chat** (Slack, Teams) for temporary sharing

#### Recommended workflow:
1. Set up environment files on each machine manually
2. Keep template files (`.env.example`) in the repository
3. Document any environment-specific configurations
4. Use version control for all other files

### Troubleshooting

#### Common Issues:

**1. Flutter not recognizing .env file:**
```bash
flutter clean
flutter pub get
```

**2. Android emulator can't reach localhost:**
- Ensure `10.0.2.2` is configured correctly
- Check if admin panel is running on localhost:3000
- Try using your machine's IP address instead

**3. iOS simulator connection issues:**
- Verify localhost:3000 is accessible in browser
- Check Flutter console for network errors
- Restart simulator if needed

**4. Firebase configuration errors:**
- Verify google-services.json is in correct location
- Ensure package names match exactly
- Clean and rebuild project

#### Quick Setup Verification:
```bash
# Test admin panel API
curl http://localhost:3000/api/health

# Test mobile environment loading
cd mobile
flutter doctor
flutter run --debug
```

### Best Practices

1. **Never commit sensitive files** to version control
2. **Use environment variables** for all configuration
3. **Document setup steps** for team members
4. **Keep consistent naming** across environments
5. **Test on both platforms** regularly
6. **Use secure methods** to share credentials

This setup ensures consistent development experience across Mac and Windows while keeping sensitive information secure.