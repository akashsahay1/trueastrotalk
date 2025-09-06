import { NextRequest } from 'next/server'
import { POST } from '../../../app/api/auth/login/route'

// Mock dependencies
jest.mock('../../../lib/database', () => ({
  __esModule: true,
  default: {
    getCollection: jest.fn(),
    closeConnection: jest.fn(),
  },
}))

jest.mock('../../../lib/security', () => ({
  PasswordSecurity: {
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  },
  JWTSecurity: {
    generateToken: jest.fn(),
  },
  ValidationSchemas: {},
  InputSanitizer: {
    sanitizeEmail: jest.fn(),
    sanitizeString: jest.fn(),
  },
}))

jest.mock('../../../lib/error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
    createError: jest.fn(),
    validationError: jest.fn(),
    authenticationError: jest.fn(),
  },
  withErrorHandler: jest.fn((fn) => fn),
}))

jest.mock('../../../lib/validation', () => ({
  Validator: {
    validate: jest.fn(),
  },
}))

import DatabaseService from '../../../lib/database'
import { PasswordSecurity, JWTSecurity, InputSanitizer } from '../../../lib/security'
import { Validator } from '../../../lib/validation'

const mockDatabaseService = DatabaseService as jest.Mocked<typeof DatabaseService>
const mockPasswordSecurity = PasswordSecurity as jest.Mocked<typeof PasswordSecurity>
const mockJWTSecurity = JWTSecurity as jest.Mocked<typeof JWTSecurity>
const mockInputSanitizer = InputSanitizer as jest.Mocked<typeof InputSanitizer>
const mockValidator = Validator as jest.Mocked<typeof Validator>

describe('/api/auth/login', () => {
  const mockUsersCollection = {
    findOne: jest.fn(),
    updateOne: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDatabaseService.getCollection.mockResolvedValue(mockUsersCollection as any)
    mockInputSanitizer.sanitizeEmail.mockImplementation((email) => email)
    mockValidator.validate.mockReturnValue({ isValid: true, errors: [] })
  })

  const createMockRequest = (body: any) => {
    return {
      json: () => Promise.resolve(body),
      headers: new Headers(),
    } as NextRequest
  }

  describe('Email/Password Login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email_address: 'admin@test.com',
        password: 'hashedPassword',
        full_name: 'Admin User',
        user_type: 'administrator',
        account_status: 'active',
        failed_login_attempts: 0,
      }

      mockUsersCollection.findOne.mockResolvedValue(mockUser)
      mockPasswordSecurity.verifyPassword.mockResolvedValue(true)
      ;(mockJWTSecurity as any).generateToken = jest.fn().mockReturnValue('mock-jwt-token')

      const request = createMockRequest({
        email_address: 'admin@test.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.token).toBe('mock-jwt-token')
      expect(data.user.email_address).toBe('admin@test.com')
    })

    it('should reject login with invalid email', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null)

      const request = createMockRequest({
        email_address: 'nonexistent@test.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('INVALID_CREDENTIALS')
    })

    it('should reject login with invalid password', async () => {
      const mockUser = {
        _id: 'user123',
        email_address: 'admin@test.com',
        password: 'hashedPassword',
        account_status: 'active',
        failed_login_attempts: 0,
      }

      mockUsersCollection.findOne.mockResolvedValue(mockUser)
      mockPasswordSecurity.verifyPassword.mockResolvedValue(false)

      const request = createMockRequest({
        email_address: 'admin@test.com',
        password: 'wrongpassword',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should reject login for banned account', async () => {
      const mockUser = {
        _id: 'user123',
        email_address: 'admin@test.com',
        password: 'hashedPassword',
        account_status: 'banned',
      }

      mockUsersCollection.findOne.mockResolvedValue(mockUser)

      const request = createMockRequest({
        email_address: 'admin@test.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('ACCOUNT_BANNED')
    })

    it('should lock account after too many failed attempts', async () => {
      const mockUser = {
        _id: 'user123',
        email_address: 'admin@test.com',
        password: 'hashedPassword',
        account_status: 'active',
        failed_login_attempts: 5,
        last_failed_login: new Date(),
      }

      mockUsersCollection.findOne.mockResolvedValue(mockUser)

      const request = createMockRequest({
        email_address: 'admin@test.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.success).toBe(false)
      expect(data.error).toContain('ACCOUNT_LOCKED')
    })
  })

  describe('Validation', () => {
    it('should reject request with missing email', async () => {
      const request = createMockRequest({
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject request with missing password', async () => {
      const request = createMockRequest({
        email_address: 'admin@test.com',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle validation errors', async () => {
      mockValidator.validate.mockReturnValue({
        isValid: false,
        errors: [{ field: 'email_address', message: 'Invalid email format', rule: 'email' }],
      })

      const request = createMockRequest({
        email_address: 'invalid-email',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockDatabaseService.getCollection.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({
        email_address: 'admin@test.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('should handle password verification errors', async () => {
      const mockUser = {
        _id: 'user123',
        email_address: 'admin@test.com',
        password: 'hashedPassword',
        account_status: 'active',
      }

      mockUsersCollection.findOne.mockResolvedValue(mockUser)
      mockPasswordSecurity.verifyPassword.mockRejectedValue(new Error('Password verification failed'))

      const request = createMockRequest({
        email_address: 'admin@test.com',
        password: 'password123',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })
  })
})