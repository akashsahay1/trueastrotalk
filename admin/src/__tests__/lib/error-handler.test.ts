import { ErrorHandler, ErrorCode, ErrorSeverity, AppError } from '../../lib/error-handler'

describe('ErrorHandler', () => {
  beforeEach(() => {
    // Clear console spies before each test
    jest.clearAllMocks()
  })

  describe('createError', () => {
    it('should create error with all properties', () => {
      const error = ErrorHandler.createError(
        ErrorCode.VALIDATION_ERROR,
        'Test error message',
        'User message',
        { field: 'email' }
      )

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.message).toBe('Test error message')
      expect(error.details).toEqual({ field: 'email' })
      expect(error.severity).toBe(ErrorSeverity.LOW)
      expect(error.timestamp).toBeDefined()
    })

    it('should create error with default severity', () => {
      const error = ErrorHandler.createError(
        ErrorCode.AUTHENTICATION_REQUIRED,
        'Auth failed'
      )

      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should generate unique timestamps', () => {
      const error1 = ErrorHandler.createError(ErrorCode.NETWORK_ERROR, 'Error 1')
      const error2 = ErrorHandler.createError(ErrorCode.NETWORK_ERROR, 'Error 2')

      expect(error1.timestamp).toBeDefined()
      expect(error2.timestamp).toBeDefined()
    })
  })

  describe('validationError', () => {
    it('should create validation error', () => {
      const error = ErrorHandler.validationError('Invalid email format', { email: 'invalid' })

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.message).toBe('Invalid email format')
      expect(error.details).toEqual({ email: 'invalid' })
    })
  })

  describe('validationError', () => {
    it('should create validation error using helper', () => {
      const error = ErrorHandler.validationError('Invalid email format', { email: 'invalid' })

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.message).toBe('Invalid email format')
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })
  })

  describe('createError for different codes', () => {
    it('should create not found error', () => {
      const error = ErrorHandler.createError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        'User not found',
        { userId: '123' }
      )

      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(error.message).toBe('User not found')
      expect(error.details).toEqual({ userId: '123' })
    })

    it('should create network error', () => {
      const error = ErrorHandler.createError(
        ErrorCode.NETWORK_ERROR,
        'Database connection failed'
      )

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.message).toBe('Database connection failed')
    })
  })

  describe('handleError', () => {
    it('should handle Error objects', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const originalError = new Error('Test error')

      const response = await ErrorHandler.handleError(originalError)
      const json = await response.json()

      expect(json.error).toBe('INTERNAL_SERVER_ERROR')
      expect(json.message).toBe('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle AppError objects', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const appError = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        400
      )

      const response = await ErrorHandler.handleError(appError)
      const json = await response.json()

      expect(json.error).toBe('VALIDATION_ERROR')
      expect(json.message).toBe('Validation failed')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

  })
})