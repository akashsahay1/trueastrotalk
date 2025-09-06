/**
 * Custom ID Generation Utility
 * 
 * Generates migration-safe custom IDs that don't change between MongoDB instances.
 * Format: {entity}_{timestamp}_{random}
 * 
 * Examples:
 * - user_1756540752442_2s0gyae9
 * - product_1756540783734_wxtlznqe
 * - order_1756540826939_f8p2yxjh
 */

/**
 * Generate a custom ID for an entity
 * @param entityType - The type of entity (user, product, order, etc.)
 * @returns A unique custom ID string
 */
export function generateCustomId(entityType: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 8);
  return `${entityType}_${timestamp}_${random}`;
}

/**
 * Generate a user_id
 * @returns A unique user_id
 */
export function generateUserId(): string {
  return generateCustomId('user');
}

/**
 * Generate a product_id
 * @returns A unique product_id
 */
export function generateProductId(): string {
  return generateCustomId('product');
}

/**
 * Generate an order_id
 * @returns A unique order_id
 */
export function generateOrderId(): string {
  return generateCustomId('order');
}

/**
 * Generate a category_id
 * @returns A unique category_id
 */
export function generateCategoryId(): string {
  return generateCustomId('category');
}

/**
 * Generate a transaction_id
 * @returns A unique transaction_id
 */
export function generateTransactionId(): string {
  return generateCustomId('txn');
}

/**
 * Generate an astrologer_id
 * @returns A unique astrologer_id
 */
export function generateAstrologerId(): string {
  return generateCustomId('astro');
}

/**
 * Generate a review_id
 * @returns A unique review_id
 */
export function generateReviewId(): string {
  return generateCustomId('review');
}

/**
 * Generate a session_id
 * @returns A unique session_id
 */
export function generateSessionId(): string {
  return generateCustomId('session');
}

/**
 * Validate if a string looks like a custom ID
 * @param id - The ID to validate
 * @returns true if it matches the custom ID pattern
 */
export function isCustomId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Pattern: entity_timestamp_random
  const pattern = /^[a-z]+_\d{13}_[a-z0-9]{8}$/;
  return pattern.test(id);
}

/**
 * Extract entity type from custom ID
 * @param customId - The custom ID
 * @returns The entity type or null if invalid
 */
export function getEntityTypeFromId(customId: string): string | null {
  if (!isCustomId(customId)) return null;
  
  return customId.split('_')[0];
}

/**
 * Extract timestamp from custom ID
 * @param customId - The custom ID
 * @returns The timestamp as Date or null if invalid
 */
export function getTimestampFromId(customId: string): Date | null {
  if (!isCustomId(customId)) return null;
  
  const timestamp = parseInt(customId.split('_')[1]);
  return new Date(timestamp);
}

// Export constants for entity types
export const ENTITY_TYPES = {
  USER: 'user',
  PRODUCT: 'product',
  ORDER: 'order',
  CATEGORY: 'category',
  TRANSACTION: 'txn',
  ASTROLOGER: 'astro',
  REVIEW: 'review',
  SESSION: 'session',
} as const;