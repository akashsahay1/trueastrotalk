#!/bin/bash

# True Astro Talk - Cross-Platform Environment Setup Script
# Run this script on both Mac and Windows (via Git Bash or WSL)

echo "🚀 Setting up True Astro Talk development environment..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    echo "📱 Detected: macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WSL_DISTRO_NAME" ]]; then
    OS="windows"  
    echo "🖥️  Detected: Windows"
else
    OS="linux"
    echo "🐧 Detected: Linux"
fi

# Create .env file if it doesn't exist
if [ ! -f "mobile/.env" ]; then
    echo "📄 Creating .env file from template..."
    cp mobile/.env.example mobile/.env
    echo "✅ Created mobile/.env - Please fill in your actual values"
else
    echo "✅ .env file already exists"
fi

# Create secure directory for sensitive files
SECURE_DIR="$HOME/.trueastrotalk-secure"
if [ ! -d "$SECURE_DIR" ]; then
    mkdir -p "$SECURE_DIR"
    echo "🔐 Created secure directory: $SECURE_DIR"
fi

# Create symlinks for sensitive files (only if they don't exist in project)
echo "🔗 Setting up secure file links..."

# Android google-services.json
if [ ! -f "mobile/android/app/google-services.json" ] && [ -f "$SECURE_DIR/google-services.json" ]; then
    ln -sf "$SECURE_DIR/google-services.json" "mobile/android/app/google-services.json"
    echo "✅ Linked google-services.json"
elif [ ! -f "$SECURE_DIR/google-services.json" ]; then
    echo "⚠️  Place your google-services.json in $SECURE_DIR/"
fi

# iOS GoogleService-Info.plist  
if [ ! -f "mobile/ios/Runner/GoogleService-Info.plist" ] && [ -f "$SECURE_DIR/GoogleService-Info.plist" ]; then
    ln -sf "$SECURE_DIR/GoogleService-Info.plist" "mobile/ios/Runner/GoogleService-Info.plist"
    echo "✅ Linked GoogleService-Info.plist"
elif [ ! -f "$SECURE_DIR/GoogleService-Info.plist" ]; then
    echo "⚠️  Place your GoogleService-Info.plist in $SECURE_DIR/"
fi

# Admin .env file
if [ ! -f "admin/.env" ] && [ -f "$SECURE_DIR/admin.env" ]; then
    ln -sf "$SECURE_DIR/admin.env" "admin/.env"
    echo "✅ Linked admin .env"
elif [ ! -f "$SECURE_DIR/admin.env" ]; then
    echo "⚠️  Place your admin .env file as admin.env in $SECURE_DIR/"
fi

echo ""
echo "📋 Setup complete! Next steps:"
echo "1. Edit mobile/.env with your configuration"
echo "2. Place sensitive files in $SECURE_DIR/"
echo "3. Run: flutter pub get (in mobile directory)"
echo "4. Run: npm install (in admin directory)"
echo ""
echo "🔧 For Windows Android Studio localhost issues:"
echo "   Set APP_ENVIRONMENT=development in mobile/.env"
echo "   The app will automatically use 10.0.2.2 for Android emulator"
echo ""