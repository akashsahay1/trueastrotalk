# Email Notification System Setup (SendGrid)

This document describes the SendGrid-based email notification system implemented for True Astro Talk admin panel.

## Features

### 1. Admin Notifications
- **New User Signup**: Admin receives email notification when any new user registers
- **Astrologer Applications**: Special notifications when astrologers register (requires review)

### 2. User Welcome Emails
- **Welcome Email**: All new users receive a welcome email after successful registration
- **Role-specific Content**: Different content for customers vs astrologers
- **Status Notifications**: Astrologers get information about review process

### 3. Astrologer Status Notifications
- **Verification Email**: Sent when astrologer is approved
- **Rejection Email**: Sent when astrologer application is declined
- **Custom Feedback**: Rejection emails can include admin feedback

## Configuration

The email system uses SendGrid for reliable email delivery. Configuration is managed in `src/lib/env-config.ts`:

```typescript
SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
```

### Environment Variables Required

Add these to your `.env` file:

```env
SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_USER=your-from-email@trueastrotalk.com  # Used as the "from" email address
```

### SendGrid Setup Steps

1. **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Generate API Key**: 
   - Go to Settings > API Keys
   - Create a new API key with "Full Access" or "Mail Send" permissions
   - Copy the API key to your `.env` file
3. **Domain Authentication** (Recommended):
   - Go to Settings > Sender Authentication
   - Authenticate your domain for better deliverability
4. **Sender Identity**: Set up a verified sender email address

## Email Templates

All email templates are responsive and include:
- Professional branding
- Clear call-to-action buttons
- Both HTML and plain text versions
- Mobile-friendly design

### Template Types

1. **Admin Signup Notification** (`getAdminSignupNotificationTemplate`)
   - User details
   - Registration timestamp
   - Action required for astrologers

2. **Welcome Email** (`getWelcomeEmailTemplate`)
   - Personalized greeting
   - Next steps based on user role
   - Platform links

3. **Astrologer Status** (`getAstrologerStatusTemplate`)
   - Verification/rejection status
   - Feedback/reason (for rejections)
   - Next steps

## Integration Points

### 1. User Registration (`/api/users/create`)
- Sends welcome email to new user
- Sends admin notification email
- Emails are sent asynchronously (non-blocking)

### 2. User Update (`/api/users/[id]`)
- Monitors verification status changes
- Sends status emails to astrologers
- Only triggers for astrologer accounts

## Usage Examples

### Checking Email Service Status
```typescript
import { envHelpers } from '@/lib/env-config';

const isEmailConfigured = envHelpers.isServiceConfigured('sendgrid');
console.log('SendGrid service ready:', isEmailConfigured);
```

### Manual Email Sending
```typescript
import { emailService } from '@/lib/email-service';

// Send welcome email
await emailService.sendWelcomeEmail(userData);

// Send astrologer status notification
await emailService.sendAstrologerStatusNotification(
  astrologerData, 
  'verified', 
  'Congratulations!'
);
```

## Error Handling

- Emails are sent asynchronously to avoid blocking API responses
- Failed email sends are logged but don't affect user operations
- SendGrid API key is validated before sending
- Graceful fallback when SendGrid is not configured
- SendGrid provides detailed error messages and delivery analytics

## Testing

To test the email system:

1. Configure SendGrid API key in environment
2. Set up a verified sender email address
3. Create a new user account
4. Check email delivery in SendGrid dashboard
5. Test astrologer verification/rejection flow

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SendGrid API key is valid
   - Verify environment variables
   - Check server logs for errors
   - Review SendGrid dashboard for rejected emails

2. **SendGrid authentication issues**
   - Ensure API key has proper permissions
   - Verify sender email is authenticated
   - Check domain authentication status

3. **Template rendering issues**
   - Verify user data structure
   - Check for missing required fields
   - Review template syntax

4. **Deliverability issues**
   - Set up domain authentication
   - Monitor SendGrid reputation
   - Check spam folder
   - Review bounce/block lists

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will provide detailed email sending logs in the console.

### SendGrid Dashboard
Monitor email delivery, opens, clicks, and bounces in the SendGrid dashboard at [app.sendgrid.com](https://app.sendgrid.com).

## Benefits of SendGrid

- **Reliable Delivery**: High deliverability rates with dedicated IPs
- **Analytics**: Detailed email analytics and reporting
- **Scalability**: Handles high email volumes efficiently
- **Security**: Built-in security features and compliance
- **Templates**: Advanced template management (future enhancement)
- **Automation**: Advanced email automation capabilities