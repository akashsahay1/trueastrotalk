import { ErrorHandler } from './error-handler';

export interface ValidationRule {
  field: string;
  value: unknown;
  rules: string[];
  customMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
  value?: unknown;
}

export class Validator {
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  private static strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  private static objectIdRegex = /^[0-9a-fA-F]{24}$/;

  static validate(rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const fieldErrors = this.validateField(rule);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateField(rule: ValidationRule): ValidationError[] {
    const { field, value, rules: validationRules, customMessage } = rule;
    const errors: ValidationError[] = [];

    for (const validationRule of validationRules) {
      const error = this.applyRule(field, value, validationRule, customMessage);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  private static applyRule(
    field: string,
    value: unknown,
    rule: string,
    customMessage?: string
  ): ValidationError | null {
    const [ruleName, ...params] = rule.split(':');

    switch (ruleName) {
      case 'required':
        return this.required(field, value, customMessage);
      case 'email':
        return this.email(field, value, customMessage);
      case 'phone':
        return this.phone(field, value, customMessage);
      case 'min':
        return this.min(field, value, parseInt(params[0]), customMessage);
      case 'max':
        return this.max(field, value, parseInt(params[0]), customMessage);
      case 'minLength':
        return this.minLength(field, value, parseInt(params[0]), customMessage);
      case 'maxLength':
        return this.maxLength(field, value, parseInt(params[0]), customMessage);
      case 'numeric':
        return this.numeric(field, value, customMessage);
      case 'objectId':
        return this.objectId(field, value, customMessage);
      default:
        return null;
    }
  }

  private static required(field: string, value: unknown, customMessage?: string): ValidationError | null {
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return {
        field,
        message: customMessage || `${field} is required`,
        rule: 'required',
        value
      };
    }
    return null;
  }

  private static email(field: string, value: unknown, customMessage?: string): ValidationError | null {
    if (value && !this.emailRegex.test(value as string)) {
      return {
        field,
        message: customMessage || `${field} must be a valid email address`,
        rule: 'email',
        value
      };
    }
    return null;
  }

  private static phone(field: string, value: unknown, customMessage?: string): ValidationError | null {
    if (value && !this.phoneRegex.test(value as string)) {
      return {
        field,
        message: customMessage || `${field} must be a valid phone number`,
        rule: 'phone',
        value
      };
    }
    return null;
  }

  private static min(field: string, value: unknown, min: number, customMessage?: string): ValidationError | null {
    if (value !== undefined && value !== null && Number(value) < min) {
      return {
        field,
        message: customMessage || `${field} must be at least ${min}`,
        rule: 'min',
        value
      };
    }
    return null;
  }

  private static max(field: string, value: unknown, max: number, customMessage?: string): ValidationError | null {
    if (value !== undefined && value !== null && Number(value) > max) {
      return {
        field,
        message: customMessage || `${field} must not exceed ${max}`,
        rule: 'max',
        value
      };
    }
    return null;
  }

  private static minLength(field: string, value: unknown, minLength: number, customMessage?: string): ValidationError | null {
    if (value && String(value).length < minLength) {
      return {
        field,
        message: customMessage || `${field} must be at least ${minLength} characters long`,
        rule: 'minLength',
        value
      };
    }
    return null;
  }

  private static maxLength(field: string, value: unknown, maxLength: number, customMessage?: string): ValidationError | null {
    if (value && String(value).length > maxLength) {
      return {
        field,
        message: customMessage || `${field} must not exceed ${maxLength} characters`,
        rule: 'maxLength',
        value
      };
    }
    return null;
  }

  private static numeric(field: string, value: unknown, customMessage?: string): ValidationError | null {
    if (value !== undefined && value !== null && isNaN(Number(value))) {
      return {
        field,
        message: customMessage || `${field} must be a number`,
        rule: 'numeric',
        value
      };
    }
    return null;
  }

  private static objectId(field: string, value: unknown, customMessage?: string): ValidationError | null {
    if (value && !this.objectIdRegex.test(value as string)) {
      return {
        field,
        message: customMessage || `${field} must be a valid ObjectId`,
        rule: 'objectId',
        value
      };
    }
    return null;
  }

  static validateRequestBody(body: Record<string, unknown>, rules: ValidationRule[]): void {
    const result = this.validate(rules);
    
    if (!result.isValid) {
      const errorDetails = result.errors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {} as Record<string, string>);

      throw ErrorHandler.validationError(
        `Validation failed: ${result.errors.map(e => e.message).join(', ')}`,
        { errors: errorDetails }
      );
    }
  }

  static validateObjectId(id: string, fieldName: string = 'id'): void {
    if (!this.objectIdRegex.test(id)) {
      throw ErrorHandler.validationError(
        `Invalid ${fieldName} format`,
        { [fieldName]: id }
      );
    }
  }

  static validatePagination(page?: string, limit?: string): { page: number; limit: number } {
    const parsedPage = parseInt(page || '1');
    const parsedLimit = parseInt(limit || '20');

    if (isNaN(parsedPage) || parsedPage < 1) {
      throw ErrorHandler.validationError('Page must be a positive integer');
    }

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw ErrorHandler.validationError('Limit must be between 1 and 100');
    }

    return { page: parsedPage, limit: parsedLimit };
  }

  static validateEmail(email: string): void {
    if (!this.emailRegex.test(email)) {
      throw ErrorHandler.validationError('Invalid email format');
    }
  }

  static validatePassword(password: string, requireStrong: boolean = true): void {
    if (!password || password.length < 8) {
      throw ErrorHandler.validationError('Password must be at least 8 characters long');
    }

    if (requireStrong && !this.strongPasswordRegex.test(password)) {
      throw ErrorHandler.validationError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
  }
}

export default Validator;