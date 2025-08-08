# True Astrotalk - Complete Development Context & Requirements

## Project Overview

**Application Name:** True Astrotalk (Astrotalk Clone)  
**Architecture:** Flutter Mobile App + Next.js Admin Panel (with integrated API routes)  
**Domain:** Astrology Consultation Platform with Commission-based Business Model  
**Primary Color:** #1877F2 (Facebook Blue)  
**Admin Template:** Influence Admin Panel (Bootstrap 4 based from ThemeForest)

## Core Business Model

### Platform Overview

- **Customers:** Immediate account activation, can consult astrologers
- **Astrologers:** Multi-step verification process before going live
- **Revenue Model:** Commission-based (20-30% platform, 70-80% astrologer)
- **Payment Flow:** Customer wallet → Consultation payment → Astrologer earnings → Monthly UPI payouts

### User Roles & Account Types

```
Customer:
- Immediate registration and activation
- Wallet-based payment system
- Access to verified astrologers only

Astrologer:
- Registration → Profile Setup → Admin Verification → Activation
- Commission-based earnings system
- Monthly payout via UPI
- Online/offline status control

Admin:
- Astrologer verification and management
- Financial oversight and payout processing
- Platform configuration and analytics

Manager:
- Limited admin access
- Customer support functions
- Basic analytics access
```

## Technical Architecture

### Project Structure

```
trueastrotalk/
├── docs/
│   └── devdoc.md     # This document
├── mobile/                        # Flutter application
│   ├── lib/
│   │   ├── common/               # Shared widgets, themes, constants
│   │   ├── config/               # App configuration, API URLs, themes
│   │   ├── models/               # Data models and entities
│   │   ├── screens/              # All app screens and pages
│   │   ├── services/             # API calls, external services
│   │   ├── utilities/            # Helper functions, extensions, validators
│   │   └── main.dart            # App entry point
└── admin/                        # Next.js admin panel + API
    ├── src/
    │   ├── app/
    │   │   ├── api/              # API routes for mobile app
    │   │   ├── dashboard/        # Admin dashboard pages
    │   │   ├── accounts/         # User management pages
    │   │   ├── sessions/         # Consultation management
    │   │   ├── transactions/     # Financial management
    │   │   └── settings/         # Platform configuration
    │   ├── components/           # React components
    │   ├── lib/                  # Utilities and configurations
    │   └── styles/               # Custom CSS with #1877F2 theme
#### Flutter Mobile App Structure
```

mobile/lib/
├── common/ # Shared components and utilities
│ ├── widgets/ # Reusable UI components
│ │ ├── custom_button.dart
│ │ ├── loading_widget.dart
│ │ ├── error_widget.dart
│ │ ├── astrologer_card.dart
│ │ └── role_based_widget.dart
│ ├── themes/ # App theming
│ │ ├── app_theme.dart # Light/dark themes with #1877F2
│ │ ├── app_colors.dart # Color constants
│ │ └── text_styles.dart # Typography styles
│ └── constants/ # App-wide constants
│ ├── app_strings.dart # Text constants
│ ├── asset_paths.dart # Image/icon paths
│ └── dimensions.dart # Spacing and sizing
├── config/ # Configuration files
│ ├── api_config.dart # API URLs and endpoints
│ ├── app_config.dart # App configuration
│ ├── environment.dart # Environment settings
│ └── dependency_injection.dart # GetIt setup
├── models/ # Data models
│ ├── user.dart # User entity with role-based properties
│ ├── astrologer.dart # Astrologer profile model
│ ├── consultation.dart # Consultation booking model
│ ├── wallet.dart # Wallet and transaction models
│ ├── chat_message.dart # Chat message model
│ ├── api_response.dart # Generic API response wrapper
│ └── enums.dart # All enums (UserRole, AccountStatus, etc.)
├── screens/ # All application screens
│ ├── auth/ # Authentication screens
│ │ ├── splash_screen.dart
│ │ ├── role_selection_screen.dart
│ │ ├── registration_screen.dart
│ │ ├── login_screen.dart
│ │ └── otp_verification_screen.dart
│ ├── customer/ # Customer-specific screens
│ │ ├── home_screen.dart
│ │ ├── astrologer_list_screen.dart
│ │ ├── astrologer_detail_screen.dart
│ │ ├── consultation_booking_screen.dart
│ │ └── kundli_screen.dart
│ ├── astrologer/ # Astrologer-specific screens
│ │ ├── profile_setup_screen.dart
│ │ ├── verification_status_screen.dart
│ │ ├── earnings_dashboard_screen.dart
│ │ ├── consultation_management_screen.dart
│ │ └── online_status_screen.dart
│ ├── consultation/ # Consultation screens (shared)
│ │ ├── chat_screen.dart
│ │ ├── voice_call_screen.dart
│ │ ├── video_call_screen.dart
│ │ └── consultation_history_screen.dart
│ ├── wallet/ # Wallet management screens
│ │ ├── wallet_screen.dart
│ │ ├── recharge_screen.dart
│ │ ├── transaction_history_screen.dart
│ │ └── payout_history_screen.dart
│ ├── profile/ # Profile management screens
│ │ ├── profile_screen.dart
│ │ ├── edit_profile_screen.dart
│ │ └── settings_screen.dart
│ └── shared/ # Shared utility screens
│ ├── notification_screen.dart
│ ├── help_support_screen.dart
│ └── terms_privacy_screen.dart
├── services/ # External services and API calls
│ ├── api/ # API service classes
│ │ ├── auth_service.dart
│ │ ├── user_service.dart
│ │ ├── astrologer_service.dart
│ │ ├── consultation_service.dart
│ │ ├── wallet_service.dart
│ │ └── upload_service.dart
│ ├── local/ # Local storage services
│ │ ├── local_storage_service.dart
│ │ ├── cache_service.dart
│ │ └── secure_storage_service.dart
│ ├── external/ # External service integrations
│ │ ├── payment_service.dart # RazorPay integration
│ │ ├── chat_service.dart # Socket.IO chat
│ │ ├── call_service.dart # Agora video/audio
│ │ ├── notification_service.dart # FCM
│ │ ├── analytics_service.dart # Firebase Analytics
│ │ └── location_service.dart # GPS and geocoding
│ └── network/ # Network layer
│ ├── dio_client.dart # HTTP client configuration
│ ├── api_interceptors.dart # Request/response interceptors
│ └── network_info.dart # Network connectivity
├── utilities/ # Helper utilities
│ ├── validators.dart # Form validation functions
│ ├── formatters.dart # Data formatting utilities
│ ├── date_utils.dart # Date/time helpers
│ ├── permission_handler.dart # Device permissions
│ ├── image_picker_util.dart # Image selection helpers
│ ├── navigation_helper.dart # Route management
│ ├── extensions.dart # Dart extensions
│ └── exception_handler.dart # Error handling utilities
└── main.dart # Application entry point

```

#### Next.js Admin Panel
- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript
- **Styling:** Bootstrap 4 (Influence template) + Custom CSS
- **UI Components:** Influence template components
- **Authentication:** NextAuth.js
- **Database:** MongoDB
- **API Integration:** Built-in API routes
- **Accent Color:** #1877F2 for buttons, highlights, and branding

#### External Services
- **Payment Gateway:** RazorPay (Payments + Payouts)
- **Real-time Communication:** Socket.IO
- **Push Notifications:** Firebase
- **Email Service:** SendGrid
- **SMS Service:** Twilio

## Coding Standards & Guidelines

### Flutter Mobile App Coding Standards

#### Comments & Documentation
- **NEVER use TODO comments** - They show warning signs in IDEs and create visual noise
- Use regular comments instead: `// Feature will be implemented later`
- Use descriptive comments for complex business logic
- Document all public methods and classes with dartdoc comments

#### Code Organization
- Follow the established folder structure strictly
- Use consistent naming conventions (camelCase for variables, PascalCase for classes)
- Keep files focused and under 300 lines when possible
- Group related functionality in the same directory

#### Dependencies Management
- Add dependencies only when actually needed
- Comment out unused dependencies instead of removing them
- Keep dependencies updated but stable (avoid bleeding edge versions)
- Document why each dependency is needed

#### Error Handling
- Use proper error handling with try-catch blocks
- Show user-friendly error messages
- Log errors for debugging but don't expose sensitive information
- Handle network timeouts and offline scenarios

#### State Management
- Use Provider for state management
- Keep state classes simple and focused
- Avoid setState in complex widgets
- Use immutable data structures when possible

#### UI/UX Standards
- Follow Material Design 3 guidelines
- Use the defined color palette (#1877F2 primary)
- Implement proper loading states
- Ensure accessibility compliance
- Test on multiple screen sizes

#### Performance
- Use const constructors where possible
- Implement proper ListView builders for dynamic lists
- Optimize image loading with caching
- Avoid blocking the main thread

#### Security
- Never commit API keys or sensitive data
- Use flutter_secure_storage for sensitive information
- Validate all user inputs
- Implement proper authentication flows

## User Flows & Business Processes

### Astrologer Onboarding & Verification Process

#### Complete Journey
1. **Registration Phase**
   - Phone/email verification
   - Role selection (astrologer)
   - Basic profile creation
   - Account status: `profile_incomplete`

2. **Profile Setup Phase (Multi-step Wizard)**
   - Personal information (name, DOB, address)
   - Professional background (education, experience)
   - Specializations and skills selection
   - Consultation rates configuration (chat, call, video)
   - Document uploads (certificates, ID proof, sample video)
   - UPI account details for payouts
   - Account status: `profile_incomplete` → `submitted` (when 80% complete)

3. **Admin Verification Phase**
   - Document authenticity verification
   - Background check (if required)
   - Sample consultation quality review
   - Rate validation against market standards
   - Account status: `submitted` → `verified` or `rejected`

4. **Activation Phase**
   - Notification to astrologer (email/SMS/push)
   - Profile goes live on platform
   - Can toggle online/offline status
   - Account status: `verified` → `active` (when online)

5. **Ongoing Operations**
   - Monthly earnings accumulation
   - Payout processing at month-end
   - Performance monitoring and compliance

#### Verification Requirements Checklist
- Government-issued ID verification
- Educational certificates validation
- Experience certificates/testimonials
- Sample consultation video quality assessment
- Rate reasonableness validation
- Platform policy agreement
- UPI account verification for payouts
- Background verification (if applicable)

### Customer Experience Flow

#### Registration & Onboarding
- Phone/email verification
- Basic profile setup (optional birth details for kundli)
- Immediate account activation
- Welcome tour of app features

#### Consultation Booking Process
1. Browse available astrologers (online, verified only)
2. Filter by specialization, language, rating, price
3. Select consultation type (chat, call, video)
4. Check wallet balance (prompt recharge if insufficient)
5. Confirm booking and payment
6. Join consultation at scheduled time
7. Rate and review after completion

## Financial System Architecture

### Wallet System Design

#### Customer Wallet Flow
```

1. Customer initiates wallet recharge
2. Payment processed via RazorPay → True Astrologer's account
3. Database wallet balance updated (cumulative)
4. Multiple payment methods supported:
   - Credit/Debit Cards
   - UPI payments
   - Net Banking
   - Digital Wallets
5. Each recharge adds to existing balance

```

#### Consultation Payment Processing
```

1. Customer books consultation
2. Total fee calculated and displayed
3. Amount deducted from customer wallet
4. Commission calculation:
   - Platform commission: 20-30%
   - Astrologer earnings: 70-80%
5. Astrologer earnings added to astrologer wallet
6. Platform commission retained in revenue account

```

#### Astrologer Payout System
```

Monthly Payout Process:

1. Global minimum threshold check (configurable by admin)
2. Month-end automated processing:
   - Identify eligible astrologers (balance >= threshold)
   - Validate UPI account details
   - Generate payout batch
3. RazorPay Payouts API execution:
   - Batch transfer from platform account
   - Direct UPI transfers to astrologers
   - Individual payout tracking
4. Wallet balance reset and history update
5. Payout confirmations and receipts

````

### Database Schema Requirements

#### Core Tables

##### Users Table (Standardized Schema)
```sql
users:
- _id (ObjectId, primary key)
- phone_number (string, unique)
- email_address (string, unique, nullable)
- full_name (string, required)
- user_type (enum: 'customer', 'astrologer', 'administrator', 'manager')
- account_status (enum: 'pending', 'profile_incomplete', 'submitted', 'verified', 'active', 'suspended', 'rejected')
- verification_status (enum: 'unverified', 'verified', 'rejected')
- is_online (boolean, for astrologers only)
- profile_image (string, URL path - DEPRECATED, use profile_image_id)
- profile_image_id (ObjectId, reference to media_files collection)
- profile_picture (string, URL path - DEPRECATED, use profile_image_id)
- bio (string, optional)
- specializations (array of strings, for astrologers)
- languages (array of strings, for astrologers)
- experience_years (number, for astrologers)
- chat_rate, call_rate, video_rate (numbers, for astrologers)
- rating (number, calculated average)
- total_reviews (number, count)
- wallet_balance (number, for customers)
- date_of_birth, time_of_birth, place_of_birth (strings, for kundli generation)
- created_at, updated_at (Date)
- verified_at, verified_by (Date, ObjectId)
- rejection_reason (string)

Note: This is a denormalized schema where astrologer-specific fields are stored
directly in the users collection rather than a separate astrologer_profiles table.
```

##### Media Files Table (New)
```sql
media_files:
- _id (ObjectId, primary key)
- filename (string, unique filename with timestamp)
- original_name (string, original uploaded filename)
- file_path (string, relative path from public directory)
- file_size (number, size in bytes)
- mime_type (string, e.g., 'image/png')
- file_type (enum: 'astrologer_profile', 'admin_upload', 'general')
- uploaded_by (string, user identifier or 'migration_script')
- associated_record (string, ObjectId of related record)
- is_external (boolean, false for local uploads)
- uploaded_at, created_at, updated_at (Date)
```

##### Astrologer Profiles Table (DEPRECATED)

```sql
astrologer_profiles:
- id (UUID, primary key)
- user_id (UUID, foreign key)
- profile_picture, bio
- personal_details (DOB, address, city, state, country, zip)
- professional_details (education, experience_years, certifications)
- specializations (array), skills (array), languages (array)
- consultation_rates (chat_rate, call_rate, video_rate)
- documents (certificates_urls, identity_document_url, sample_video_url)
- upi_id (for payouts)
- rating, total_reviews
- profile_completion_percentage
- admin_notes, submitted_at, verified_at
```

##### Wallet Tables

```sql
customer_wallets:
- customer_id, wallet_balance
- total_recharged, total_spent
- last_recharge_amount, last_recharge_at

astrologer_wallets:
- astrologer_id, wallet_balance
- total_earned, total_withdrawn
- last_payout_amount, last_payout_at
- upi_id

wallet_transactions:
- user_id, transaction_type, amount
- balance_before, balance_after
- razorpay_payment_id, razorpay_payout_id
- status, description, created_at
```

##### Consultation Tables

```sql
consultations:
- id, customer_id, astrologer_id
- type (chat, voice, video)
- status (pending, active, completed, cancelled)
- scheduled_at, started_at, ended_at, duration_minutes
- amount, commission_percentage
- astrologer_earnings, platform_commission
- rating, review
- chat_room_id, call_id

consultation_messages:
- consultation_id, sender_id, message
- message_type (text, image, document)
- timestamp, metadata
```

## API Specifications

### Authentication APIs

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-otp
POST /api/auth/refresh-token
POST /api/auth/logout
GET  /api/auth/status
```

### Customer APIs

```
GET  /api/customers/profile
PUT  /api/customers/profile
GET  /api/customers/wallet/balance
POST /api/customers/wallet/recharge
GET  /api/customers/wallet/transactions
POST /api/customers/consultations/book
GET  /api/customers/consultations/history
```

### Astrologer APIs

```
GET  /api/astrologers/profile
PUT  /api/astrologers/profile
POST /api/astrologers/profile/submit
PUT  /api/astrologers/online-status
GET  /api/astrologers/wallet/balance
GET  /api/astrologers/wallet/earnings-history
PUT  /api/astrologers/wallet/upi-details
GET  /api/astrologers/consultations/pending
PUT  /api/astrologers/consultations/:id/status
```

### Public Discovery APIs

```
GET  /api/astrologers/available
GET  /api/astrologers/:id/profile
GET  /api/astrologers/search
GET  /api/categories/specializations
GET  /api/horoscope/daily/:sign
```

### Admin APIs

```
GET  /api/admin/dashboard/stats
GET  /api/admin/users
GET  /api/admin/astrologers/pending
PUT  /api/admin/astrologers/:id/verify
PUT  /api/admin/astrologers/:id/reject
GET  /api/admin/sessions/all
GET  /api/admin/transactions/summary
POST /api/admin/payouts/process-monthly
GET  /api/admin/settings/commission-rates
PUT  /api/admin/settings/minimum-threshold
```

### File Upload APIs

```
POST /api/upload/profile-image
POST /api/upload/certificate
POST /api/upload/identity-document
POST /api/upload/sample-video
```

## Mobile App Requirements

### Design System

- **Primary Color:** #1877F2
- **Design Language:** Material Design 3 for Android, Cupertino for iOS
- **Theme:** Light/Dark mode support
- **Typography:** System fonts with consistent scaling
- **Accessibility:** Full accessibility compliance

### Screen Structure

#### Authentication Screens

- Splash screen with branding
- Role selection (customer vs astrologer)
- Registration form (adaptive per role)
- OTP verification
- Login screen
- Forgot password flow

#### Customer Screens

- Home dashboard with astrologer discovery
- Astrologer listing with search/filters
- Astrologer profile detail view
- Consultation booking interface
- Active consultation screens (chat/call/video)
- Wallet management (balance, recharge, history)
- Profile management
- Consultation history
- Kundli generation and viewing

#### Astrologer Screens

- Profile setup wizard (multi-step)
- Verification status tracking
- Earnings dashboard
- Online/offline status toggle
- Consultation management (pending/active/completed)
- Customer interaction screens
- Payout history and UPI management
- Performance analytics

#### Shared Screens

- Notification center
- Settings and preferences
- Help and support
- Terms and privacy policy

### Key Features Implementation

#### Real-time Chat System

- Socket.IO integration for instant messaging
- Message types: text, image, document
- Typing indicators and read receipts
- Message history and search
- File sharing capability

#### Video/Audio Calling

- Native WebRTC implementation
- HD video quality optimization
- Audio-only call option
- Network quality indicators

#### Push Notifications

- Firebase Cloud Messaging
- Real-time consultation updates
- Promotional notifications
- Earnings and payout alerts
- System announcements

#### Kundli Generation

- Birth chart calculation and display
- Multiple chart formats (North/South Indian)
- Planetary position analysis
- Daily horoscope integration
- Compatibility matching
- PDF export functionality

## Admin Panel Requirements

### UI/UX Specifications

- **Base Template:** Influence Admin Panel (Bootstrap 4)
- **Primary Accent:** #1877F2 for buttons, links, highlights
- **Custom Styling:** Adapt template colors to match brand
- **Responsive Design:** Mobile-first admin interface
- **Theme Consistency:** Maintain professional look with brand colors

### Page Structure

#### Dashboard

- Real-time platform metrics
- Verification queue summary
- Revenue analytics
- User activity overview
- Recent transactions
- System health indicators

#### Accounts Management

```
/accounts/customers
- Customer list with search/filters
- Profile viewing and editing
- Account status management
- Transaction history per customer

/accounts/astrologers
- All astrologers with status filters
- Performance metrics view
- Commission rate management
- Bulk operations

/accounts/astrologers/pending
- Verification queue
- Profile review interface
- Document viewer with zoom
- Approve/reject workflow

/accounts/administrators
- Admin user management
- Role and permission assignment
- Activity logging
```

#### Sessions Management

```
/sessions/calls
- Active and completed call sessions
- Call quality metrics
- Duration and cost analysis

/sessions/chats
- Chat session monitoring
- Message volume analytics
- Customer satisfaction tracking

/sessions/video
- Video consultation oversight
- Quality assurance tools
- Technical issue tracking
```

#### Financial Management

```
/transactions/recharges
- Customer wallet recharge tracking
- Payment gateway analytics
- Failed transaction monitoring

/transactions/commissions
- Commission calculation oversight
- Astrologer earnings summary
- Platform revenue analytics

/transactions/payouts
- Monthly payout processing interface
- Bulk payout management
- Failed payout retry mechanism
- Payout history and reconciliation
```

#### Platform Configuration

```
/settings/commission-rates
- Global commission percentage settings
- Tier-based rate configuration
- Special rate assignments

/settings/payout-settings
- Minimum threshold configuration
- Payout schedule management
- UPI validation settings

/settings/platform-config
- App feature toggles
- Maintenance mode controls
- System-wide announcements
```

### Admin Workflow Features

#### Astrologer Verification Workflow

- Comprehensive profile review interface
- Document authenticity verification tools
- Sample consultation quality assessment
- Background check integration
- Bulk approval for qualified candidates
- Rejection feedback system

#### Financial Operations

- Real-time revenue monitoring
- Commission calculation verification
- Monthly payout batch processing
- Failed transaction resolution
- Financial reconciliation reports
- Tax compliance documentation

#### Customer Support Tools

- Customer query management system
- Consultation dispute resolution
- Refund processing interface
- Ban/suspension management
- Communication templates

## Integration Requirements

### RazorPay Integration

#### Payment Gateway (Customer Recharges)

- Order creation for wallet recharge
- Multiple payment method support
- Payment success/failure webhooks
- Automatic wallet balance updates
- Transaction receipt generation

#### Payouts API (Astrologer Payments)

- Contact and fund account creation
- Batch payout processing
- UPI transfer capabilities
- Payout status monitoring
- Failed payout handling and retry logic

#### Webhook Management

- payment.captured (customer payments)
- payment.failed (payment failures)
- payout.processed (successful payouts)
- payout.failed (payout failures)
- Webhook signature verification
- Event logging and processing

### Third-party Service Integrations

#### Communication Services

- Firebase Cloud Messaging (push notifications)
- Twilio (SMS notifications)
- SendGrid (email communications)
- Socket.IO (real-time chat)
- WebRTC (video/audio calling)

#### Infrastructure Services

- Redis (caching and session management)
- MongoDB (primary database)
- Elasticsearch (search and analytics)

## Quality Assurance Requirements

### Testing Strategy

#### Mobile App Testing

- Unit tests for business logic (80%+ coverage)
- Widget tests for UI components
- Integration tests for API interactions
- End-to-end tests for critical user flows
- Performance testing on various devices
- Accessibility testing compliance

#### API Testing

- Unit tests for all endpoints
- Integration tests for business workflows
- Load testing for peak usage scenarios
- Security testing for authentication
- Data validation and error handling tests

#### Admin Panel Testing

- Component testing for React components
- Page load and performance testing
- Cross-browser compatibility testing
- Responsive design verification
- Security testing for admin functions

### Performance Requirements

#### Mobile App Performance

- App launch time < 3 seconds
- Screen transition animations < 300ms
- API response handling < 1 second
- Image loading with progressive enhancement
- Offline capability for core functions

#### API Performance

- Response time < 500ms for standard queries
- Database query optimization with indexing
- Efficient pagination for large datasets
- Caching strategy for frequently accessed data
- Rate limiting and throttling implementation

#### Admin Panel Performance

- Page load time < 2 seconds
- Real-time data updates without full refresh
- Efficient data table rendering
- Optimized asset loading and bundling

## Security & Compliance

### Authentication & Authorization

- JWT token-based authentication
- Role-based access control (RBAC)
- Session management and timeout
- Multi-factor authentication for admin
- API rate limiting and throttling

### Data Security

- End-to-end encryption for sensitive data
- PCI DSS compliance for payment data
- Personal data encryption at rest
- Secure file upload and storage
- Regular security audits and penetration testing

### Privacy & Compliance

- GDPR compliance for data protection
- User consent management
- Data retention and deletion policies
- Privacy policy and terms of service
- Cookie consent and management

## Deployment & Infrastructure

### Mobile App Deployment

- Google Play Store submission
- Apple App Store submission
- Staged rollout strategy (beta → production)
- Over-the-air update capability
- Crash reporting and analytics integration

### Admin Panel Deployment

- VPS deployment with HTTPS
- Docker containerization
- CI/CD pipeline setup
- Environment-specific configurations
- Monitoring and logging implementation

### Database & Storage

- MongoDB database with replication
- Automated backup and recovery
- Redis caching layer
- Database migration management

## Development Workflow

### Project Setup

1. **Admin Panel First:** Build Next.js with API routes and deploy to VPS
2. **HTTPS Configuration:** Essential for Google OAuth and production testing
3. **Flutter Development:** Consume real API endpoints from deployed admin panel
4. **Iterative Development:** Use shared context document for consistency

### Claude Code Development Strategy

```bash
# Admin Panel Development
cd admin
claude-code --context="../docs/devdoc.md"
# Focus: API routes, admin interface, RazorPay integration

# Mobile App Development
cd mobile
claude-code --context="../docs/devdoc.md"
# Focus: UI/UX, API consumption, real-time features
```

### Environment Configuration

- Development, Staging, Production environments
- Environment-specific API URLs and keys
- Feature flags for gradual rollout
- Monitoring and logging per environment

This comprehensive development context provides all specifications needed to build the complete True Astrologer platform using Claude Code, ensuring consistency across both mobile app and admin panel development while maintaining the exact business model and technical requirements specified.

## Development Progress Log

### August 3, 2025 - Image Loading & Network Optimization

#### Issues Resolved

**NetworkImageLoadException for Astrologer Profile Images**
- **Problem**: 17 astrologers had broken Unsplash profile image URLs returning 404 errors
- **Root Cause**: Unsplash URLs (`https://images.unsplash.com/photo-*`) were no longer valid
- **Solution**: Updated all broken URLs to reliable DiceBear avatar service
- **Implementation**:
  - Used `https://api.dicebear.com/7.x/avataaars/png?seed={name}&size=150` format
  - Generated unique avatars based on astrologer names
  - Updated 72 total astrologers (17 with broken URLs + 55 without any profile images)

#### Database Updates

**Astrologer Profile Image Migration**
- **Database**: `trueastrotalkDB` collection `users`
- **Records Updated**: 72 astrologer profiles
- **Fields Modified**: `profile_image` and `profile_picture`
- **New Image Source**: DiceBear avatars (reliable, consistent, unique per astrologer)
- **Verification**: Confirmed 0 remaining Unsplash URLs in database

#### Technical Details

**Image URL Structure Before:**
```
https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=150&h=150&fit=crop&crop=face
```

**Image URL Structure After:**
```
https://api.dicebear.com/7.x/avataaars/png?seed=meera&size=150
```

#### Files Referenced
- `/mobile/lib/screens/home.dart:408` - Astrologer profile image display in `_buildNewAstrologerCard`
- `/mobile/lib/services/network/dio_client.dart:25-44` - Network logging configuration
- Database: `trueastrotalkDB.users` collection - Profile image fields updated

#### Impact
- ✅ Eliminated NetworkImageLoadException errors in Flutter app
- ✅ All astrologer profile images now load consistently
- ✅ Improved user experience with reliable avatar display
- ✅ Future-proofed image loading with stable service provider

#### Next Steps Identified
- Mobile app feature completion continues
- Real-time consultation system implementation
- Payment gateway integration testing

Alright now push all changes, but exclude the google-service.json and ios firebase plist file, also in windows android studio I was not able to run app with locahost
api url in android simulator. Also my this machine is mac but my office machine is windows and i am facing issues of maintaing the app consitency with sensitive files
like .env, google-services.json and googleservice-info.plist files because we cant push them in git because git blocks it due to sensitive api keys data in it, so how
to make the app perfectly in sync while working on the same codebase in 2 different os environment as setting this correctly will also help me in setting things for
other apps as well. Also while pushing i want this to be taken, because i already pushed in git but not pulled before making changes.
````
