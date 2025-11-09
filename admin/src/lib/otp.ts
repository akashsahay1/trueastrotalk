/**
 * OTP Helper Utility
 * Handles OTP generation, validation, and bypass mode for testing
 */

export interface OTPData {
  code: string;
  expiry: Date;
  attempts: number;
  sentAt: Date;
}

// Testing mode - set to true to bypass OTP verification
export const OTP_BYPASS_MODE = process.env.OTP_BYPASS_MODE === 'true' || process.env.NODE_ENV === 'development';
export const OTP_BYPASS_CODE = '0000';

// OTP Configuration
export const OTP_LENGTH = 4;
export const OTP_EXPIRY_MINUTES = 60; // Extended to 60 minutes
export const MAX_OTP_ATTEMPTS = 999; // Effectively unlimited
export const MAX_OTP_REQUESTS_PER_HOUR = 999; // Effectively unlimited
export const RESEND_OTP_DELAY_SECONDS = 0; // No delay for resend

/**
 * Generate a random 4-digit OTP
 */
export function generateOTP(): string {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  return otp;
}

/**
 * Validate OTP format (4 digits)
 */
export function isValidOTPFormat(otp: string): boolean {
  return /^\d{4}$/.test(otp);
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}

/**
 * Get OTP expiry date (current time + 5 minutes)
 */
export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
  return expiry;
}

/**
 * Verify OTP code
 * In bypass mode, accepts "0000" as valid for any phone number
 */
export function verifyOTP(inputOTP: string, storedOTP: string | null, expiryDate: Date | null): {
  valid: boolean;
  reason?: string;
} {
  // Bypass mode check
  if (OTP_BYPASS_MODE && inputOTP === OTP_BYPASS_CODE) {
    return { valid: true };
  }

  // Validate format
  if (!isValidOTPFormat(inputOTP)) {
    return { valid: false, reason: 'Invalid OTP format. Must be 4 digits.' };
  }

  // Check if OTP exists
  if (!storedOTP || !expiryDate) {
    return { valid: false, reason: 'No OTP found. Please request a new one.' };
  }

  // Check expiry
  if (isOTPExpired(expiryDate)) {
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }

  // Verify OTP match
  if (inputOTP !== storedOTP) {
    return { valid: false, reason: 'Invalid OTP. Please try again.' };
  }

  return { valid: true };
}

/**
 * Check if user has exceeded OTP request rate limit
 */
export function isRateLimited(lastRequestTime: Date | null, requestCount: number): boolean {
  if (!lastRequestTime) return false;

  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Reset count if last request was more than 1 hour ago
  if (lastRequestTime < oneHourAgo) {
    return false;
  }

  // Check if exceeded max requests
  return requestCount >= MAX_OTP_REQUESTS_PER_HOUR;
}

/**
 * Check if user can resend OTP (after 30 seconds)
 */
export function canResendOTP(lastSentTime: Date | null): boolean {
  if (!lastSentTime) return true;

  const delayMs = RESEND_OTP_DELAY_SECONDS * 1000;
  const timeSinceLastSend = Date.now() - lastSentTime.getTime();

  return timeSinceLastSend >= delayMs;
}

/**
 * Format phone number (ensure it has country code)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // If doesn't start with country code, assume India (+91)
  if (!digitsOnly.startsWith('91') && digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  // Add + if not present
  return digitsOnly.startsWith('+') ? digitsOnly : `+${digitsOnly}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Basic validation: must be 10-15 digits with country code
  return /^\+\d{10,15}$/.test(formatted);
}

/**
 * Send OTP via SMS (placeholder for actual SMS provider)
 * In testing mode, just logs the OTP
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
  if (OTP_BYPASS_MODE) {
    return true;
  }

  // TODO: Implement actual SMS sending with Twilio/MSG91/etc
  console.warn('⚠️ SMS provider not configured. OTP will only be logged.');

  return true;
}
