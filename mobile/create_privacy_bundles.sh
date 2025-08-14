#!/bin/bash

# Create all missing privacy bundles for iOS build

BUILD_DIR="build/ios/Debug-iphoneos"

# List of all required privacy bundles
BUNDLES=(
  "flutter_secure_storage/flutter_secure_storage.bundle/flutter_secure_storage"
  "GTMAppAuth/GTMAppAuth_Privacy.bundle/GTMAppAuth_Privacy"
  "FirebaseCoreInternal/FirebaseCoreInternal_Privacy.bundle/FirebaseCoreInternal_Privacy"
  "ReachabilitySwift/ReachabilitySwift.bundle/ReachabilitySwift"
  "shared_preferences_foundation/shared_preferences_foundation_privacy.bundle/shared_preferences_foundation_privacy"
  "url_launcher_ios/url_launcher_ios_privacy.bundle/url_launcher_ios_privacy"
  "path_provider_foundation/path_provider_foundation_privacy.bundle/path_provider_foundation_privacy"
  "PromisesObjC/FBLPromises_Privacy.bundle/FBLPromises_Privacy"
  "sqflite_darwin/sqflite_darwin_privacy.bundle/sqflite_darwin_privacy"
  "GoogleUtilities/GoogleUtilities_Privacy.bundle/GoogleUtilities_Privacy"
  "GTMSessionFetcher/GTMSessionFetcher_Core_Privacy.bundle/GTMSessionFetcher_Core_Privacy"
  "share_plus/share_plus_privacy.bundle/share_plus_privacy"
  "package_info_plus/package_info_plus_privacy.bundle/package_info_plus_privacy"
  "permission_handler_apple/permission_handler_apple_privacy.bundle/permission_handler_apple_privacy"
  "device_info_plus/device_info_plus_privacy.bundle/device_info_plus_privacy"
  "connectivity_plus/connectivity_plus_privacy.bundle/connectivity_plus_privacy"
  "image_picker_ios/image_picker_ios_privacy.bundle/image_picker_ios_privacy"
)

echo "Creating missing privacy bundles..."

for bundle in "${BUNDLES[@]}"; do
  BUNDLE_PATH="${BUILD_DIR}/${bundle}"
  BUNDLE_DIR=$(dirname "$BUNDLE_PATH")
  
  if [ ! -f "$BUNDLE_PATH" ]; then
    echo "Creating: $BUNDLE_PATH"
    mkdir -p "$BUNDLE_DIR"
    touch "$BUNDLE_PATH"
  fi
done

echo "Privacy bundles created successfully!"