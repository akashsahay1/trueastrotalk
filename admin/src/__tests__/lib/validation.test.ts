import { Validator, ValidationRule } from '../../lib/validation'

describe('Validator', () => {
  describe('validate', () => {
    it('should validate multiple rules and return all errors', () => {
      const rules: ValidationRule[] = [
        { field: 'name', value: '', rules: ['required'] },
        { field: 'email', value: 'invalid-email', rules: ['email'] },
        { field: 'age', value: 15, rules: ['min:18'] }
      ]

      const result = Validator.validate(rules)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors.map(e => e.field)).toEqual(['name', 'email', 'age'])
    })

    it('should pass validation when all rules are satisfied', () => {
      const rules: ValidationRule[] = [
        { field: 'name', value: 'John Doe', rules: ['required'] },
        { field: 'email', value: 'john@example.com', rules: ['email'] },
        { field: 'age', value: 25, rules: ['min:18'] }
      ]

      const result = Validator.validate(rules)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('validateField', () => {
    it('should validate single field with multiple rules', () => {
      const rule: ValidationRule = {
        field: 'password',
        value: 'weak',
        rules: ['required', 'minLength:8']
      }

      const errors = Validator.validateField(rule)

      expect(errors).toHaveLength(1)
      expect(errors[0].rule).toBe('minLength')
    })

    it('should use custom error message', () => {
      const rule: ValidationRule = {
        field: 'username',
        value: '',
        rules: ['required'],
        customMessage: 'Username cannot be empty'
      }

      const errors = Validator.validateField(rule)

      expect(errors[0].message).toBe('Username cannot be empty')
    })
  })

  describe('Individual validation rules', () => {
    describe('required', () => {
      it('should validate required fields', () => {
        const rules: ValidationRule[] = [
          { field: 'name', value: 'John', rules: ['required'] },
          { field: 'empty', value: '', rules: ['required'] },
          { field: 'null', value: null, rules: ['required'] },
          { field: 'array', value: [], rules: ['required'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(3)
        expect(result.errors.map(e => e.field)).toEqual(['empty', 'null', 'array'])
      })
    })

    describe('email', () => {
      it('should validate email format', () => {
        const rules: ValidationRule[] = [
          { field: 'valid', value: 'test@example.com', rules: ['email'] },
          { field: 'invalid', value: 'not-an-email', rules: ['email'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].field).toBe('invalid')
      })
    })

    describe('phone', () => {
      it('should validate phone number format', () => {
        const rules: ValidationRule[] = [
          { field: 'valid', value: '+1234567890', rules: ['phone'] },
          { field: 'invalid', value: 'abc123', rules: ['phone'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].field).toBe('invalid')
      })
    })

    describe('numeric range validation', () => {
      it('should validate min/max values', () => {
        const rules: ValidationRule[] = [
          { field: 'tooLow', value: 5, rules: ['min:10'] },
          { field: 'valid', value: 15, rules: ['min:10', 'max:20'] },
          { field: 'tooHigh', value: 25, rules: ['max:20'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(2)
        expect(result.errors.map(e => e.field)).toEqual(['tooLow', 'tooHigh'])
      })
    })

    describe('string length validation', () => {
      it('should validate string lengths', () => {
        const rules: ValidationRule[] = [
          { field: 'tooShort', value: 'hi', rules: ['minLength:5'] },
          { field: 'valid', value: 'hello', rules: ['minLength:3', 'maxLength:10'] },
          { field: 'tooLong', value: 'very long string here', rules: ['maxLength:10'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(2)
        expect(result.errors.map(e => e.field)).toEqual(['tooShort', 'tooLong'])
      })
    })

    describe('numeric validation', () => {
      it('should validate numeric values', () => {
        const rules: ValidationRule[] = [
          { field: 'number', value: 123, rules: ['numeric'] },
          { field: 'stringNumber', value: '456', rules: ['numeric'] },
          { field: 'notNumber', value: 'abc', rules: ['numeric'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].field).toBe('notNumber')
      })
    })

    describe('objectId validation', () => {
      it('should validate MongoDB ObjectId format', () => {
        const rules: ValidationRule[] = [
          { field: 'valid', value: '507f1f77bcf86cd799439011', rules: ['objectId'] },
          { field: 'invalid', value: 'not-an-objectid', rules: ['objectId'] }
        ]

        const result = Validator.validate(rules)

        expect(result.errors).toHaveLength(1)
        expect(result.errors[0].field).toBe('invalid')
      })
    })
  })

  describe('Utility methods', () => {
    describe('validateObjectId', () => {
      it('should validate ObjectId and not throw for valid ID', () => {
        expect(() => {
          Validator.validateObjectId('507f1f77bcf86cd799439011')
        }).not.toThrow()
      })

      it('should throw error for invalid ObjectId', () => {
        expect(() => {
          Validator.validateObjectId('invalid-id')
        }).toThrow('Invalid id format')
      })
    })

    describe('validatePagination', () => {
      it('should validate and parse pagination parameters', () => {
        const result = Validator.validatePagination('2', '10')

        expect(result).toEqual({ page: 2, limit: 10 })
      })

      it('should use defaults for missing parameters', () => {
        const result = Validator.validatePagination()

        expect(result).toEqual({ page: 1, limit: 20 })
      })

      it('should throw error for invalid page', () => {
        expect(() => {
          Validator.validatePagination('0', '10')
        }).toThrow('Page must be a positive integer')
      })

      it('should throw error for invalid limit', () => {
        expect(() => {
          Validator.validatePagination('1', '200')
        }).toThrow('Limit must be between 1 and 100')
      })
    })

    describe('validateEmail', () => {
      it('should validate email and not throw for valid email', () => {
        expect(() => {
          Validator.validateEmail('test@example.com')
        }).not.toThrow()
      })

      it('should throw error for invalid email', () => {
        expect(() => {
          Validator.validateEmail('invalid-email')
        }).toThrow('Invalid email format')
      })
    })

    describe('validatePassword', () => {
      it('should validate strong password', () => {
        expect(() => {
          Validator.validatePassword('StrongPass123!', true)
        }).not.toThrow()
      })

      it('should throw error for weak password when strong required', () => {
        expect(() => {
          Validator.validatePassword('weak', true)
        }).toThrow()
      })

      it('should accept simple password when strong not required', () => {
        expect(() => {
          Validator.validatePassword('simplepass', false)
        }).not.toThrow()
      })

      it('should throw error for short password', () => {
        expect(() => {
          Validator.validatePassword('short', false)
        }).toThrow('Password must be at least 8 characters long')
      })
    })
  })
})