'use client';

import React, { useState } from 'react';

// Form Field Components
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className = '' }: FormGroupProps) {
  return <div className={`form-group ${className}`}>{children}</div>;
}

interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormLabel({ htmlFor, required, children, className = '' }: FormLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`form-label ${className}`}>
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
}

interface FormControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  isValid?: boolean;
  isInvalid?: boolean;
}

export function FormControl({
  error,
  isValid,
  isInvalid,
  className = '',
  ...props
}: FormControlProps) {
  const validationClass = isValid ? 'is-valid' : isInvalid ? 'is-invalid' : '';
  
  return (
    <>
      <input 
        className={`form-control ${validationClass} ${className}`} 
        {...props} 
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  isValid?: boolean;
  isInvalid?: boolean;
  children: React.ReactNode;
}

export function FormSelect({
  error,
  isValid,
  isInvalid,
  className = '',
  children,
  ...props
}: FormSelectProps) {
  const validationClass = isValid ? 'is-valid' : isInvalid ? 'is-invalid' : '';
  
  return (
    <>
      <select 
        className={`form-control ${validationClass} ${className}`} 
        {...props}
      >
        {children}
      </select>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  isValid?: boolean;
  isInvalid?: boolean;
}

export function FormTextarea({
  error,
  isValid,
  isInvalid,
  className = '',
  ...props
}: FormTextareaProps) {
  const validationClass = isValid ? 'is-valid' : isInvalid ? 'is-invalid' : '';
  
  return (
    <>
      <textarea 
        className={`form-control ${validationClass} ${className}`} 
        {...props} 
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </>
  );
}

// Complete Form Field Component
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  as?: 'input' | 'select' | 'textarea';
  rows?: number;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode; // For select options
}

export function FormField({
  label,
  name,
  type = 'text',
  required = false,
  error,
  value,
  onChange,
  placeholder,
  options,
  as = 'input',
  rows = 3,
  className = '',
  disabled = false,
  children
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const isInvalid = !!error;

  const renderField = () => {
    switch (as) {
      case 'select':
        return (
          <FormSelect
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            isInvalid={isInvalid}
            disabled={disabled}
            className={className}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {children}
          </FormSelect>
        );
      
      case 'textarea':
        return (
          <FormTextarea
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            isInvalid={isInvalid}
            disabled={disabled}
            className={className}
          />
        );
      
      default:
        return (
          <FormControl
            id={fieldId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            isInvalid={isInvalid}
            disabled={disabled}
            className={className}
          />
        );
    }
  };

  return (
    <FormGroup>
      <FormLabel htmlFor={fieldId} required={required}>
        {label}
      </FormLabel>
      {renderField()}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FormGroup>
  );
}

// Form validation utilities
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export function validateForm(
  values: Record<string, string>,
  rules: ValidationRules
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(fieldName => {
    const value = values[fieldName] || '';
    const rule = rules[fieldName];

    // Required validation
    if (rule.required && !value.trim()) {
      errors[fieldName] = 'This field is required';
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value.trim()) return;

    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      errors[fieldName] = `Must be at least ${rule.minLength} characters`;
      return;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors[fieldName] = `Must be no more than ${rule.maxLength} characters`;
      return;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[fieldName] = 'Invalid format';
      return;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors[fieldName] = customError;
        return;
      }
    }
  });

  return errors;
}

// Common validation rules
export const commonRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  
  phone: {
    pattern: /^\+?[1-9]\d{1,14}$/,
    custom: (value: string) => {
      if (!/^\+?[1-9]\d{9,14}$/.test(value.replace(/\s/g, ''))) {
        return 'Please enter a valid phone number';
      }
      return null;
    }
  },
  
  password: {
    minLength: 8,
    custom: (value: string) => {
      if (value.length < 8) {
        return 'Password must be at least 8 characters';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain uppercase, lowercase and number';
      }
      return null;
    }
  }
};

// Hook for form handling
export function useForm(
  initialValues: Record<string, string>,
  validationRules: ValidationRules = {}
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const setFieldTouched = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValue(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setFieldTouched(name);
    
    // Validate single field
    const fieldErrors = validateForm({ [name]: values[name] }, { [name]: validationRules[name] });
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  const validate = () => {
    const newErrors = validateForm(values, validationRules);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = (newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}