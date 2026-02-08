/**
 * Centralized Rate Validation for Astrologers
 *
 * This module provides consistent rate validation across all API endpoints.
 * All rate validation should use these constants and functions to ensure consistency.
 */

// Rate limits for astrologer consultation fees (in ₹ per minute)
export const RATE_LIMITS = {
  chat: { min: 5, max: 500 },
  call: { min: 10, max: 1000 },
  video: { min: 15, max: 1500 },
} as const;

// Type for rate field names
export type RateType = 'chat' | 'call' | 'video';

// Interface for rate validation result
export interface RateValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedRates: {
    chat_rate?: number;
    call_rate?: number;
    video_rate?: number;
  };
}

/**
 * Validate a single rate value
 * @param rate - The rate value to validate
 * @param rateType - The type of rate (chat, call, video)
 * @returns Object with isValid flag and error message if invalid
 */
export function validateSingleRate(
  rate: unknown,
  rateType: RateType
): { isValid: boolean; error?: string; value?: number } {
  const limits = RATE_LIMITS[rateType];

  // If rate is not provided or empty, it's valid (rates are optional)
  if (rate === undefined || rate === null || rate === '') {
    return { isValid: true };
  }

  // Parse the rate to number
  const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate);

  // Check if it's a valid number
  if (isNaN(numericRate)) {
    return {
      isValid: false,
      error: `${rateType.charAt(0).toUpperCase() + rateType.slice(1)} rate must be a valid number`,
    };
  }

  // Check minimum limit
  if (numericRate < limits.min) {
    return {
      isValid: false,
      error: `${rateType.charAt(0).toUpperCase() + rateType.slice(1)} rate must be at least ₹${limits.min} per minute`,
    };
  }

  // Check maximum limit
  if (numericRate > limits.max) {
    return {
      isValid: false,
      error: `${rateType.charAt(0).toUpperCase() + rateType.slice(1)} rate cannot exceed ₹${limits.max} per minute`,
    };
  }

  return { isValid: true, value: numericRate };
}

/**
 * Validate all consultation rates
 * @param rates - Object containing chat_rate, call_rate, and video_rate
 * @returns Validation result with errors and sanitized rates
 */
export function validateAllRates(rates: {
  chat_rate?: unknown;
  call_rate?: unknown;
  video_rate?: unknown;
}): RateValidationResult {
  const errors: string[] = [];
  const sanitizedRates: RateValidationResult['sanitizedRates'] = {};

  // Validate chat rate
  const chatValidation = validateSingleRate(rates.chat_rate, 'chat');
  if (!chatValidation.isValid && chatValidation.error) {
    errors.push(chatValidation.error);
  } else if (chatValidation.value !== undefined) {
    sanitizedRates.chat_rate = chatValidation.value;
  }

  // Validate call rate
  const callValidation = validateSingleRate(rates.call_rate, 'call');
  if (!callValidation.isValid && callValidation.error) {
    errors.push(callValidation.error);
  } else if (callValidation.value !== undefined) {
    sanitizedRates.call_rate = callValidation.value;
  }

  // Validate video rate
  const videoValidation = validateSingleRate(rates.video_rate, 'video');
  if (!videoValidation.isValid && videoValidation.error) {
    errors.push(videoValidation.error);
  } else if (videoValidation.value !== undefined) {
    sanitizedRates.video_rate = videoValidation.value;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedRates,
  };
}

/**
 * Check if at least one rate is set
 * @param rates - Object containing consultation rates
 * @returns True if at least one rate is greater than 0
 */
export function hasAtLeastOneRate(rates: {
  chat_rate?: number;
  call_rate?: number;
  video_rate?: number;
}): boolean {
  return (
    (rates.chat_rate != null && rates.chat_rate > 0) ||
    (rates.call_rate != null && rates.call_rate > 0) ||
    (rates.video_rate != null && rates.video_rate > 0)
  );
}

/**
 * Get default rates for a new astrologer
 * @returns Object with default rates
 */
export function getDefaultRates(): {
  chat_rate: number;
  call_rate: number;
  video_rate: number;
} {
  return {
    chat_rate: 30,
    call_rate: 50,
    video_rate: 80,
  };
}

/**
 * Format rate limit error message for API response
 * @param rateType - The type of rate
 * @returns Formatted error message with limits
 */
export function getRateLimitMessage(rateType: RateType): string {
  const limits = RATE_LIMITS[rateType];
  const label = rateType.charAt(0).toUpperCase() + rateType.slice(1);
  return `${label} rate must be between ₹${limits.min} and ₹${limits.max} per minute`;
}
