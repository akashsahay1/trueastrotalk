# TrueAstroTalk - Remaining Issues

**Last Updated:** 2024-11-29

## Summary

| Priority | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| Critical | 18 | 7 | 11 |
| High | 31 | 7 | 24 |
| Medium | 25 | 1 | 24 |
| Low | 15 | 0 | 15 |

---

## 1. Security Issues

### SEC-003: Firebase API Keys Configuration (OPERATIONAL)
**Severity:** HIGH
**Status:** Requires manual GCP configuration
**Issue:** Firebase client API keys are in source code. While client keys are designed to be public, API key restrictions should be configured in Google Cloud Console.
**Action Required:** Configure API key restrictions in Google Cloud Console.

---

## 2. Astrologer Signup Flow Issues

### AST-001: No Client-Side Image Validation
**Severity:** MEDIUM
**Location:** `lib/screens/signup.dart`
**Issue:** No file size or MIME type validation before upload.

### AST-002: Race Condition in Profile Image Upload
**Severity:** HIGH
**Location:** `lib/services/auth/auth_service.dart`
**Issue:** Profile image uploads AFTER registration. If upload fails, user is registered but has no image.

### AST-003: No Upload Progress Indicator
**Severity:** MEDIUM
**Location:** `lib/screens/signup.dart`
**Issue:** No progress bar during file upload.

### AST-004: PAN Card Format Not Validated
**Severity:** MEDIUM
**Location:** Both mobile and backend
**Issue:** No validation of PAN card format (ABCDE1234F pattern).

### AST-005: Bank Account Not Verified
**Severity:** MEDIUM
**Location:** Backend API
**Issue:** No actual bank account verification against IFSC/account number.

### AST-006: Missing Draft Save Functionality
**Severity:** LOW
**Location:** `lib/screens/signup.dart`
**Issue:** 6-section form must be completed in one session; no draft saving.

---

## 3. Admin Verification Flow Issues

### ADM-001: No Automated PAN Validation
**Severity:** HIGH
**Location:** Admin panel verification
**Issue:** PAN card verification is 100% manual; no OCR or API validation.

### ADM-002: Missing Audit Trail
**Severity:** HIGH
**Location:** `admin/src/app/api/users/[id]/route.ts`
**Issue:** No detailed logging of who approved/rejected astrologers.

### ADM-003: Bulk Verification Risk
**Severity:** MEDIUM
**Location:** `admin/src/app/accounts/astrologers/page.tsx`
**Issue:** Can bulk approve/reject without confirmation dialog.

### ADM-004: No Re-submission Workflow
**Severity:** MEDIUM
**Location:** Admin panel
**Issue:** Rejected astrologers have no way to reapply from app.

### ADM-005: Incomplete Verification Checks
**Severity:** MEDIUM
**Location:** Admin verification flow
**Issue:** No automated age verification (must be 18+).

---

## 4. Profile Update Issues

### PRF-003: Status Cannot Be Changed by Self-Update API
**Severity:** HIGH
**Location:** `admin/src/app/api/users/profile/route.ts`
**Issue:** `account_status` and `verification_status` are protected fields.

### PRF-004: Inconsistent Field Names
**Severity:** LOW
**Location:** Mobile app and Backend
**Issue:** Field name mismatches (time_of_birth vs birth_time).

---

## 5. Customer Signup Flow Issues

### CUS-001: Phone Signup Creates Account Without Email
**Severity:** MEDIUM
**Location:** `lib/screens/phone_signup.dart`
**Issue:** Phone-only signup doesn't collect email address.

### CUS-002: No Email Verification
**Severity:** MEDIUM
**Location:** Registration flow
**Issue:** Email addresses are never verified after registration.

### CUS-003: Token Storage Redundancy
**Severity:** LOW
**Location:** `lib/services/auth/auth_service.dart`
**Issue:** Tokens stored in both SharedPreferences AND LocalStorageService.

### CUS-004: No Resend Limit Display
**Severity:** LOW
**Location:** `lib/screens/otp_verification.dart`
**Issue:** No visible limit on OTP resends shown to user.

---

## 6. Consultation Flow Issues (Video/Audio/Chat)

### CON-002: Race Condition in Billing Updates
**Severity:** HIGH
**Location:** `lib/services/billing/billing_service.dart`
**Issue:** Multiple billing updates could be sent concurrently without mutex/lock.

### CON-005: Hardcoded Astrologer Commission
**Severity:** MEDIUM
**Location:** Multiple files
**Issue:** 80/20 commission split is hardcoded.

### CON-006: No Call Rating UI
**Severity:** MEDIUM
**Location:** Active call screen
**Issue:** API supports rating but no UI implemented.

### CON-007: No Call Recording
**Severity:** LOW
**Location:** WebRTC service
**Issue:** No recording of calls for dispute resolution.

### CON-008: Insufficient Balance Detection Too Late
**Severity:** MEDIUM
**Location:** `lib/services/billing/billing_service.dart`
**Issue:** Low balance warning at fixed 2 minutes, should vary by rate.

---

## 7. Notification System Issues

### NOT-002: SESSION_ENDED Type Now Used
**Severity:** LOW
**Location:** `admin/src/lib/notifications.ts`
**Issue:** Now implemented. Consider removing from tracking.

### NOT-003: No Session Started Notifications for Calls
**Severity:** MEDIUM
**Location:** `admin/src/lib/notification-triggers.ts`
**Issue:** onChatSessionStarted exists but no equivalent for calls.

### NOT-004: Email Templates Missing for Consultations
**Severity:** MEDIUM
**Location:** Email service
**Issue:** No consultation completion email templates.

### NOT-005: FCM Token Update Edge Case
**Severity:** LOW
**Location:** `lib/services/notification_service.dart`
**Issue:** If auth token is null, FCM token won't update.

---

## 8. Wallet & Transaction Issues

### WAL-003: No Idempotency Key for Billing
**Severity:** MEDIUM
**Location:** `PATCH /api/sessions`
**Issue:** No idempotency protection; retry could cause duplicate charges.

### WAL-004: Non-Atomic Wallet Operations
**Severity:** MEDIUM
**Location:** `admin/src/app/api/customers/wallet/recharge/route.ts`
**Issue:** Transaction created after wallet update; not atomic.

### WAL-005: Transaction Missing Session Details
**Severity:** MEDIUM
**Location:** Transaction records
**Issue:** Some transactions lack complete session information.

---

## 9. API & Database Issues

### API-001: Inconsistent User ID Handling
**Severity:** HIGH
**Location:** Multiple API routes
**Issue:** Some APIs use MongoDB `_id`, others use custom `user_id`.

### API-002: N+1 Query Problem
**Severity:** HIGH
**Location:** `admin/src/app/api/finance/wallets/route.ts`
**Issue:** Loop fetches transactions/sessions for each user individually.

### API-003: In-Memory Pagination
**Severity:** MEDIUM
**Location:** Multiple list endpoints
**Issue:** All records loaded, then sliced for pagination.

### API-004: Missing Input Validation
**Severity:** HIGH
**Location:** Various endpoints
**Issue:** Email, phone, dates, bank details not properly validated.

### API-005: Inconsistent Error Responses
**Severity:** MEDIUM
**Location:** All API routes
**Issue:** Error response format varies across endpoints.

### API-006: Missing Rate Limiting
**Severity:** HIGH
**Location:** Sensitive endpoints
**Issue:** Many endpoints lack rate limiting.

---

## 10. Performance Issues

### PERF-001: Multiple Database Queries Per Request
**Severity:** MEDIUM
**Location:** Various endpoints
**Issue:** Separate queries for related data instead of aggregation.

### PERF-002: No Caching Layer
**Severity:** MEDIUM
**Location:** Frequently accessed data
**Issue:** Astrologer options, user profiles fetched fresh each time.

### PERF-003: Large Payload Responses
**Severity:** LOW
**Location:** List endpoints
**Issue:** Full objects returned even when only summary needed.

### PERF-004: Missing Database Indexes
**Severity:** MEDIUM
**Location:** Transactions collection
**Issue:** Complex queries on non-indexed fields.

---

## Completed Issues (Fixed)

| ID | Issue | Resolution |
|----|-------|------------|
| SEC-001 | Unauthenticated API Endpoints | Added authentication to finance/transactions, finance/wallets, notifications/push, notifications/admin/history |
| SEC-002 | Insecure Password Hashing (SHA256) | Replaced with bcrypt using PasswordSecurity.hashPassword() |
| SEC-004 | PAN Card Image URL Exposure | Created secure media endpoint at /api/media/secure |
| SEC-005 | CSRF Protection | Already implemented via withSecurity middleware |
| PRF-001 | PAN Card Upload Not Processed | Added PAN card file handling in profile update endpoint |
| PRF-002 | No Re-verification on PAN Update | Added automatic verification_status reset when PAN card is updated |
| CON-001 | Billing Failure Risk | Implemented retry queue for failed billing updates |
| WAL-002 | Billing Failure Not Recovered | Implemented retry queue with persistence |
| NOT-001 | Session End Notifications Not Sent | Added sendSessionEndedNotification to calls and chat end handlers |
| WAL-001 | Local vs Server Balance Desync | Updated wallet service to use server-confirmed balance |
| WAL-006 | No Payment Verification | Added Razorpay signature verification and API validation |
| CON-003 | Chat to Call Session ID Bug | Fixed to create new call session via CallService |
| CON-004 | No Session Reconnection | Added reconnection logic with 3 retry attempts in WebRTC service |

---

## Next Priority Fixes

1. **CON-002**: Race Condition in Billing - Add mutex/lock for concurrent updates
2. **API-001**: Inconsistent User ID Handling - Standardize across all endpoints
3. **ADM-002**: Missing Audit Trail - Add detailed approval/rejection logging
4. **API-004**: Missing Input Validation - Add validation for emails, phones, dates
5. **AST-002**: Profile Image Upload Race Condition - Upload image before registration

---

*Last Updated: 2024-11-29*
