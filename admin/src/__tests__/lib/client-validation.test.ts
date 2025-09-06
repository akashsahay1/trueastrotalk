import {
  validateForm,
  getProductFormRules,
  getUserFormRules,
  getCategoryFormRules,
  displayFieldErrors,
  clearValidationErrors,
  ClientValidator
} from '../../lib/client-validation'

describe('Client Validation', () => {
  describe('validateForm', () => {
    it('should validate required fields', () => {
      const formData = { name: '', email: 'test@example.com' }
      const rules = { name: { required: true }, email: { required: true } }

      const result = validateForm(formData, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].field).toBe('name')
      expect(result.errors[0].message).toContain('required')
    })

    it('should validate email format', () => {
      const formData = { email: 'invalid-email' }
      const rules = { email: { email: true } }

      const result = validateForm(formData, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('valid email')
    })

    it('should validate minimum values', () => {
      const formData = { price: '5' }
      const rules = { price: { min: 10 } }

      const result = validateForm(formData, rules)

      expect(result.isValid).toBe(false)
      expect(result.errors[0].message).toContain('at least 10')
    })

    it('should pass validation for valid data', () => {
      const formData = { 
        name: 'Valid Name',
        email: 'test@example.com',
        price: '15'
      }
      const rules = {
        name: { required: true },
        email: { required: true, email: true },
        price: { required: true, min: 10 }
      }

      const result = validateForm(formData, rules)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Form Rule Getters', () => {
    it('should return product form rules', () => {
      const rules = getProductFormRules()

      expect(rules).toHaveProperty('name')
      expect(rules).toHaveProperty('price')
      expect(rules).toHaveProperty('category')
      expect(rules.name.required).toBe(true)
      expect(rules.price.min).toBe(0)
    })

    it('should return user form rules', () => {
      const rules = getUserFormRules()

      expect(rules).toHaveProperty('full_name')
      expect(rules).toHaveProperty('email_address')
      expect(rules.email_address.email).toBe(true)
    })

    it('should return category form rules', () => {
      const rules = getCategoryFormRules()

      expect(rules).toHaveProperty('name')
      expect(rules).toHaveProperty('description')
      expect(rules.name.required).toBe(true)
    })
  })

  describe('ClientValidator', () => {
    describe('email', () => {
      it('should validate correct email', () => {
        expect(ClientValidator.email('test@example.com')).toBe(true)
        expect(ClientValidator.email('user.name+tag@domain.co.uk')).toBe(true)
      })

      it('should reject invalid email', () => {
        expect(ClientValidator.email('invalid-email')).toBe(false)
        expect(ClientValidator.email('test@')).toBe(false)
        expect(ClientValidator.email('@domain.com')).toBe(false)
      })
    })

    describe('phone', () => {
      it('should validate correct phone numbers', () => {
        expect(ClientValidator.phone('1234567890')).toBe(true)
        expect(ClientValidator.phone('+1234567890')).toBe(true)
      })

      it('should reject invalid phone numbers', () => {
        expect(ClientValidator.phone('123')).toBe(false)
        expect(ClientValidator.phone('abc123')).toBe(false)
      })
    })

    describe('required', () => {
      it('should validate required values', () => {
        expect(ClientValidator.required('value')).toBe(true)
        expect(ClientValidator.required(123)).toBe(true)
        expect(ClientValidator.required(['item'])).toBe(true)
      })

      it('should reject empty values', () => {
        expect(ClientValidator.required('')).toBe(false)
        expect(ClientValidator.required(null)).toBe(false)
        expect(ClientValidator.required(undefined)).toBe(false)
        expect(ClientValidator.required([])).toBe(false)
      })
    })

    describe('min/max', () => {
      it('should validate number ranges', () => {
        expect(ClientValidator.min(10, 5)).toBe(true)
        expect(ClientValidator.min(5, 5)).toBe(true)
        expect(ClientValidator.min(3, 5)).toBe(false)

        expect(ClientValidator.max(5, 10)).toBe(true)
        expect(ClientValidator.max(10, 10)).toBe(true)
        expect(ClientValidator.max(15, 10)).toBe(false)
      })
    })

    describe('minLength/maxLength', () => {
      it('should validate string lengths', () => {
        expect(ClientValidator.minLength('hello', 3)).toBe(true)
        expect(ClientValidator.minLength('hi', 3)).toBe(false)

        expect(ClientValidator.maxLength('hello', 10)).toBe(true)
        expect(ClientValidator.maxLength('very long string', 5)).toBe(false)
      })
    })

    describe('objectId', () => {
      it('should validate MongoDB ObjectId format', () => {
        expect(ClientValidator.objectId('507f1f77bcf86cd799439011')).toBe(true)
        expect(ClientValidator.objectId('invalid-id')).toBe(false)
        expect(ClientValidator.objectId('123')).toBe(false)
      })
    })

    describe('url', () => {
      it('should validate URLs', () => {
        expect(ClientValidator.url('https://example.com')).toBe(true)
        expect(ClientValidator.url('http://localhost:3000')).toBe(true)
        expect(ClientValidator.url('invalid-url')).toBe(false)
      })
    })

    describe('validateField', () => {
      it('should validate field with multiple rules', () => {
        const result = ClientValidator.validateField('test@example.com', ['required', 'email'])
        expect(result).toBeNull()
      })

      it('should return error for invalid field', () => {
        const result = ClientValidator.validateField('', ['required'])
        expect(result).toBe('This field is required')
      })

      it('should validate field with parameters', () => {
        const result = ClientValidator.validateField('ab', ['minLength:3'])
        expect(result).toBe('Must be at least 3 characters')
      })
    })
  })

  describe('Error Display Functions', () => {
    it('should display field errors', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email' }
      ]

      const result = displayFieldErrors(errors)

      expect(result).toEqual({
        name: 'Name is required',
        email: 'Invalid email'
      })
    })

    it('should clear validation errors', () => {
      const result = clearValidationErrors()
      expect(result).toEqual({})
    })
  })
})