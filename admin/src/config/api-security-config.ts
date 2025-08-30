/**
 * API Security Configuration
 * Defines security requirements for each API endpoint
 */

import { SecurityPresets } from '@/lib/api-security';

export const ApiSecurityConfig = {
  // Authentication endpoints - high security, no auth required
  '/api/auth/login': SecurityPresets.auth,
  '/api/auth/logout': SecurityPresets.auth,
  '/api/auth/forgot-password': SecurityPresets.auth,
  '/api/auth/reset-password': SecurityPresets.auth,
  '/api/auth/refresh': SecurityPresets.auth,

  // Admin-only endpoints - highest security
  '/api/admin/users': SecurityPresets.admin,
  '/api/admin/users/[id]': SecurityPresets.admin,
  '/api/admin/orders': SecurityPresets.admin,
  '/api/admin/orders/export': SecurityPresets.admin,
  '/api/admin/analytics': SecurityPresets.admin,
  '/api/admin/system': SecurityPresets.admin,
  
  // Manager-level endpoints
  '/api/users': SecurityPresets.manager,
  '/api/users/[id]': SecurityPresets.manager,
  '/api/orders': SecurityPresets.manager,
  '/api/products': SecurityPresets.manager,
  '/api/categories': SecurityPresets.manager,
  '/api/media': SecurityPresets.manager,
  
  // Customer endpoints
  '/api/users/profile': SecurityPresets.customer,
  '/api/orders/my': SecurityPresets.customer,
  '/api/wallet': SecurityPresets.customer,
  '/api/sessions': SecurityPresets.customer,
  
  // Astrologer endpoints
  '/api/astrologers/consultations': SecurityPresets.astrologer,
  '/api/astrologers/earnings': SecurityPresets.astrologer,
  '/api/astrologers/profile': SecurityPresets.astrologer,
  
  // File upload endpoints
  '/api/upload': SecurityPresets.upload,
  '/api/media/upload': SecurityPresets.upload,
  
  // Webhook endpoints (external services)
  '/api/webhooks/razorpay': SecurityPresets.webhook,
  '/api/webhooks/sendgrid': SecurityPresets.webhook,
  
  // Public endpoints (minimal security)
  '/api/public/categories': SecurityPresets.public,
  '/api/public/products': SecurityPresets.public,
  '/api/public/astrologers': SecurityPresets.public,
  
  // Financial endpoints - admin only with extra security
  '/api/finance/transactions': {
    ...SecurityPresets.admin,
    rateLimit: {
      requests: 50,
      windowMs: 15 * 60 * 1000, // Stricter rate limiting
    },
  },
  '/api/finance/wallet': SecurityPresets.admin,
  '/api/finance/commissions': SecurityPresets.admin,
  
  // Notification endpoints
  '/api/notifications/bulk': SecurityPresets.admin,
  '/api/notifications/email': SecurityPresets.manager,
  '/api/notifications/push': SecurityPresets.manager,
};

/**
 * Priority endpoints that need immediate security implementation
 */
export const HighPrioritySecurityEndpoints = [
  // Critical admin endpoints
  '/api/admin/users',
  '/api/admin/users/[id]',
  '/api/admin/orders',
  '/api/users/[id]',
  '/api/finance/transactions',
  '/api/finance/transactions/[id]',
  '/api/notifications/bulk',
  '/api/upload',
];

/**
 * Endpoints that currently lack proper security
 */
export const VulnerableEndpoints = {
  // Missing authentication
  noAuth: [
    '/api/users/route.ts',
    '/api/users/[id]/route.ts',
    '/api/admin/orders/route.ts',
    '/api/products/route.ts',
    '/api/categories/route.ts',
    '/api/media/route.ts',
    '/api/upload/route.ts',
    '/api/notifications/bulk/route.ts',
    '/api/astrologers/route.ts',
  ],
  
  // Missing rate limiting
  noRateLimit: [
    '/api/users/route.ts',
    '/api/users/create/route.ts',
    '/api/users/profile/route.ts',
    '/api/users/[id]/route.ts',
    '/api/products/route.ts',
    '/api/categories/route.ts',
    '/api/media/route.ts',
    '/api/upload/route.ts',
    '/api/orders/route.ts',
    '/api/admin/orders/route.ts',
    '/api/admin/orders/export/route.ts',
    '/api/notifications/bulk/route.ts',
    '/api/notifications/email/route.ts',
    '/api/astrologers/route.ts',
    '/api/astrologers/[id]/route.ts',
    '/api/astrologers/consultations/route.ts',
  ],
  
  // Missing input validation
  noValidation: [
    '/api/users/route.ts',
    '/api/users/create/route.ts', 
    '/api/users/[id]/route.ts',
    '/api/products/route.ts',
    '/api/categories/route.ts',
    '/api/orders/route.ts',
    '/api/admin/orders/route.ts',
    '/api/notifications/bulk/route.ts',
    '/api/notifications/email/route.ts',
    '/api/astrologers/route.ts',
    '/api/astrologers/[id]/route.ts',
  ],
  
  // Missing CSRF protection (all endpoints currently)
  noCSRF: 'ALL_ENDPOINTS',
};

/**
 * Security implementation checklist
 */
export const SecurityChecklist = {
  implemented: [
    '✅ Created comprehensive security middleware (api-security.ts)',
    '✅ Added CSRF token management',
    '✅ Created security presets for different endpoint types',
    '✅ Added rate limiting infrastructure',
    '✅ Added role-based access control',
    '✅ Added input sanitization',
    '✅ Created example secure endpoint',
  ],
  
  inProgress: [
    '🔄 Applying security middleware to high-priority endpoints',
    '🔄 Testing security implementations',
  ],
  
  pending: [
    '⏳ Apply security to all 72 identified API endpoints',
    '⏳ Add comprehensive input validation schemas',
    '⏳ Implement audit logging for sensitive operations',
    '⏳ Add security headers middleware',
    '⏳ Create security monitoring and alerting',
    '⏳ Add brute force protection for login endpoints',
    '⏳ Implement IP-based rate limiting',
  ],
};

export default ApiSecurityConfig;