# Fixes Completed

This document tracks the issues that have been identified and resolved in the TrueAstroTalk platform.

## Completed Fixes

### API-001: Standardize User ID Handling
- Changed all API routes to use custom `user_id` instead of MongoDB `_id`
- This ensures consistent references across database migrations/exports
- Files updated: Multiple API routes in admin panel

### API-004: Input Validation & Sanitization
- Added `InputSanitizer.sanitizeMongoQuery()` to all routes handling user input
- Routes updated:
  - `auth/verify-otp`
  - `auth/send-otp`
  - `auth/phone-login`
  - `auth/phone-signup`
  - `auth/phone-login-complete`
  - `customers/wallet/recharge`
  - `notifications/fcm-token`
- Added FCM token format validation

### ADM-002: Audit Trail for Verifications
- Added `logVerificationAudit()` function in `users/[id]/route.ts`
- Logs all verification status changes (approved/rejected) with:
  - User details
  - Admin who made the change
  - Previous and new status
  - Reason for rejection (if applicable)
  - Timestamp

### CON-002: Billing Race Condition
- Added mutex/lock pattern in `billing_service.dart`
- Prevents concurrent billing updates from causing data corruption
- Uses `_isBillingInProgress` flag to serialize billing operations

### WAL-001: Wallet Balance Desync
- Updated Flutter wallet service to use server-confirmed balance
- Added `syncWithServer()` method
- Prevented local balance from diverging from server state

### WAL-006: Razorpay Payment Verification
- Added full signature verification using Razorpay's HMAC
- Added API verification to confirm payment status and amount
- Prevents payment tampering or replay attacks

### CON-003: Chat to Call Session ID Bug
- Fixed to create new call session via `CallService.startCallSession()`
- Previously was incorrectly reusing chat session ID for calls

### CON-004: Session Reconnection Logic
- Added `reconnecting` state to `CallState` enum
- Implemented `_attemptReconnection()` with 3 retry attempts
- Graceful handling of temporary connection drops

### NOT-001: Session End Notifications
- Added `sendSessionEndedNotification()` method
- Sends FCM push notifications when calls/chats end
- Notifies both customer and astrologer

### PRF-002: PAN Re-verification Trigger
- Profile updates to bank details now trigger PAN re-verification

### SEC-004: Secure Media Endpoint
- Created secure endpoint for sensitive document access
- Requires authentication to access PAN cards and other sensitive files

### SEC-005: CSRF Protection
- Verified existing CSRF protection is in place
- Uses double-submit cookie pattern

## Notes

### SEC-003: Firebase Client API Keys
- Firebase client API keys are designed to be public (per Google's documentation)
- Security is enforced through Firebase Security Rules, not key secrecy
- No changes needed - this is working as designed
