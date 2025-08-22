'use client';

/**
 * Client-side validation utilities
 * These are safe to use in client components without importing server-side modules
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Legacy validation functions for backward compatibility
export function validateForm(formData: Record<string, unknown>, rules: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Simple validation logic
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field] as Record<string, unknown>;
    
    if (fieldRules.required && (!value || value === '')) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')} is required`
      });
    }
    
    if (fieldRules.min as number && value && Number(value) < (fieldRules.min as number as number)) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')} must be at least ${fieldRules.min as number}`
      });
    }
    
    if (fieldRules.email && value && !isValidEmail(value as string)) {
      errors.push({
        field,
        message: 'Please enter a valid email address'
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getProductFormRules() {
  return {
    name: { required: true },
    description: { required: true },
    price: { required: true, min: 0 },
    category: { required: true },
    stock_quantity: { required: true, min: 0 }
  };
}

export function getUserFormRules() {
  return {
    full_name: { required: true },
    email_address: { required: true, email: true },
    user_type: { required: true }
  };
}

export function getCategoryFormRules() {
  return {
    name: { required: true },
    description: { required: true }
  };
}

export function displayFieldErrors(errors: ValidationError[]): { [key: string]: string } {
  const fieldErrors: { [key: string]: string } = {};
  errors.forEach(error => {
    fieldErrors[error.field] = error.message;
  });
  return fieldErrors;
}

export function clearValidationErrors() {
  // This is handled by React state in the component
  // Keeping for backward compatibility
  return {};
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Modern validation utilities
export class ClientValidator {
  static email(value: string): boolean {
    return isValidEmail(value);
  }

  static phone(value: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value);
  }

  static required(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '' && 
           !(Array.isArray(value) && value.length === 0);
  }

  static min(value: number, min: number): boolean {
    return value >= min;
  }

  static max(value: number, max: number): boolean {
    return value <= max;
  }

  static minLength(value: string, minLength: number): boolean {
    return Boolean(value && value.length >= minLength);
  }

  static maxLength(value: string, maxLength: number): boolean {
    return Boolean(value && value.length <= maxLength);
  }

  static objectId(value: string): boolean {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(value);
  }

  static url(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  static validateField(value: unknown, rules: string[]): string | null {
    for (const rule of rules) {
      const [ruleName, ...params] = rule.split(':');
      
      switch (ruleName) {
        case 'required':
          if (!this.required(value)) {
            return 'This field is required';
          }
          break;
        case 'email':
          if (value && !this.email(value as string)) {
            return 'Please enter a valid email address';
          }
          break;
        case 'phone':
          if (value && !this.phone(value as string)) {
            return 'Please enter a valid phone number';
          }
          break;
        case 'min':
          if (value !== undefined && value !== null && !this.min(Number(value), Number(params[0]))) {
            return `Must be at least ${params[0]}`;
          }
          break;
        case 'max':
          if (value !== undefined && value !== null && !this.max(Number(value), Number(params[0]))) {
            return `Must not exceed ${params[0]}`;
          }
          break;
        case 'minLength':
          if (value && !this.minLength(String(value), Number(params[0]))) {
            return `Must be at least ${params[0]} characters`;
          }
          break;
        case 'maxLength':
          if (value && !this.maxLength(String(value), Number(params[0]))) {
            return `Must not exceed ${params[0]} characters`;
          }
          break;
        case 'objectId':
          if (value && !this.objectId(value as string)) {
            return 'Invalid ID format';
          }
          break;
        case 'url':
          if (value && !this.url(value as string)) {
            return 'Please enter a valid URL';
          }
          break;
      }
    }
    
    return null;
  }
}

export default ClientValidator;