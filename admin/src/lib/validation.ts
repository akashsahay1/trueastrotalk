/**
 * Form Validation Utilities for TrueAstroTalk Admin Panel
 * Provides comprehensive client-side validation with detailed error messages
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  firstError?: string;
}

/**
 * Validation rules for common field types
 */
export const validationRules = {
  // User validation rules
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s\.]+$/,
    message: 'Full name must be 2-50 characters and contain only letters, spaces, and dots'
  },
  
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  
  phone: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    message: 'Please enter a valid 10-digit mobile number'
  },
  
  password: {
    required: true,
    minLength: 6,
    maxLength: 20,
    message: 'Password must be 6-20 characters long'
  },
  
  city: {
    required: true,
    minLength: 2,
    maxLength: 30,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'City must be 2-30 characters and contain only letters and spaces'
  },
  
  state: {
    required: true,
    minLength: 2,
    maxLength: 30,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'State must be 2-30 characters and contain only letters and spaces'
  },
  
  userType: {
    required: true,
    custom: (value: string) => ['customer', 'astrologer', 'administrator', 'manager'].includes(value),
    message: 'Please select a valid user type'
  },
  
  accountStatus: {
    required: true,
    custom: (value: string) => ['active', 'inactive', 'banned'].includes(value),
    message: 'Please select a valid account status'
  },

  // Product validation rules
  productName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    message: 'Product name must be 3-100 characters long'
  },
  
  productDescription: {
    maxLength: 500,
    message: 'Product description cannot exceed 500 characters'
  },
  
  productPrice: {
    required: true,
    custom: (value: string) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 0 && num <= 999999;
    },
    message: 'Please enter a valid price between ₹1 and ₹999,999'
  },
  
  stockQuantity: {
    required: true,
    custom: (value: string) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && num <= 99999;
    },
    message: 'Please enter a valid stock quantity (0-99,999)'
  },

  // Category validation rules
  categoryName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s&\-]+$/,
    message: 'Category name must be 2-50 characters and contain only letters, spaces, & and -'
  },
  
  categoryDescription: {
    maxLength: 200,
    message: 'Category description cannot exceed 200 characters'
  },

  // Common validation rules
  required: {
    required: true,
    message: 'This field is required'
  },
  
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Please enter a valid URL starting with http:// or https://'
  }
};

/**
 * Validate a single field
 */
export function validateField(value: string, rules: ValidationRule): string | null {
  // Required check
  if (rules.required && (!value || value.trim() === '')) {
    return rules.message || 'This field is required';
  }
  
  // Skip other validations if field is empty and not required
  if (!value || value.trim() === '') {
    return null;
  }
  
  const trimmedValue = value.trim();
  
  // Min length check
  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return rules.message || `Minimum ${rules.minLength} characters required`;
  }
  
  // Max length check
  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return rules.message || `Maximum ${rules.maxLength} characters allowed`;
  }
  
  // Pattern check
  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return rules.message || 'Invalid format';
  }
  
  // Custom validation
  if (rules.custom && !rules.custom(trimmedValue)) {
    return rules.message || 'Invalid value';
  }
  
  return null;
}

/**
 * Validate multiple fields
 */
export function validateForm(
  formData: Record<string, string>,
  fieldRules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {};
  
  for (const [fieldName, rules] of Object.entries(fieldRules)) {
    const value = formData[fieldName] || '';
    const error = validateField(value, rules);
    
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  const isValid = Object.keys(errors).length === 0;
  const firstError = isValid ? undefined : Object.values(errors)[0];
  
  return {
    isValid,
    errors,
    firstError
  };
}

/**
 * Get user form validation rules based on user type
 */
export function getUserFormRules(userType?: string): Record<string, ValidationRule> {
  const baseRules = {
    full_name: validationRules.fullName,
    email_address: validationRules.email,
    phone_number: validationRules.phone,
    city: validationRules.city,
    state: validationRules.state,
    user_type: validationRules.userType,
    account_status: validationRules.accountStatus
  };

  // Add password validation for new users
  if (!userType) {
    return {
      ...baseRules,
      password: validationRules.password
    };
  }

  return baseRules;
}

/**
 * Get product form validation rules
 */
export function getProductFormRules(): Record<string, ValidationRule> {
  return {
    name: validationRules.productName,
    description: validationRules.productDescription,
    price: validationRules.productPrice,
    category: validationRules.required,
    stock_quantity: validationRules.stockQuantity
  };
}

/**
 * Get category form validation rules
 */
export function getCategoryFormRules(): Record<string, ValidationRule> {
  return {
    name: validationRules.categoryName,
    description: validationRules.categoryDescription
  };
}

/**
 * Display validation errors on form fields
 */
export function displayFieldErrors(errors: Record<string, string>) {
  // Clear previous errors
  document.querySelectorAll('.validation-error').forEach(el => el.remove());
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  
  // Display new errors
  for (const [fieldName, errorMessage] of Object.entries(errors)) {
    const field = document.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (field) {
      // Add error class
      field.classList.add('is-invalid');
      
      // Create error message element
      const errorElement = document.createElement('div');
      errorElement.className = 'validation-error text-danger small mt-1';
      errorElement.textContent = errorMessage;
      
      // Insert error message after the field
      field.parentNode?.insertBefore(errorElement, field.nextSibling);
    }
  }
}

/**
 * Clear all validation errors
 */
export function clearValidationErrors() {
  document.querySelectorAll('.validation-error').forEach(el => el.remove());
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

/**
 * Real-time validation helper
 */
export function setupRealTimeValidation(
  formElement: HTMLFormElement,
  fieldRules: Record<string, ValidationRule>
) {
  Object.keys(fieldRules).forEach(fieldName => {
    const field = formElement.querySelector(`[name="${fieldName}"]`) as HTMLInputElement;
    if (field) {
      field.addEventListener('blur', () => {
        const error = validateField(field.value, fieldRules[fieldName]);
        
        // Clear previous error for this field
        const existingError = field.parentNode?.querySelector('.validation-error');
        if (existingError) {
          existingError.remove();
        }
        field.classList.remove('is-invalid');
        
        // Show new error if exists
        if (error) {
          field.classList.add('is-invalid');
          const errorElement = document.createElement('div');
          errorElement.className = 'validation-error text-danger small mt-1';
          errorElement.textContent = error;
          field.parentNode?.insertBefore(errorElement, field.nextSibling);
        }
      });
    }
  });
}