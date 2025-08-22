import { ErrorHandler, ErrorCode, ErrorSeverity } from '../../lib/error-handler'

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
        { field: 'email' },
        ErrorSeverity.HIGH
      )

      expect(error).toEqual({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test error message',
        details: { field: 'email' },
        severity: ErrorSeverity.HIGH,
        timestamp: expect.any(Date),
        requestId: expect.any(String)
      })
    })

    it('should create error with default severity', () => {
      const error = ErrorHandler.createError(
        ErrorCode.AUTHENTICATION_ERROR,
        'Auth failed'
      )

      expect(error.severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should generate unique request IDs', () => {
      const error1 = ErrorHandler.createError(ErrorCode.NETWORK_ERROR, 'Error 1')
      const error2 = ErrorHandler.createError(ErrorCode.NETWORK_ERROR, 'Error 2')

      expect(error1.requestId).not.toBe(error2.requestId)
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

  describe('authenticationError', () => {
    it('should create authentication error', () => {
      const error = ErrorHandler.authenticationError('Invalid token')

      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR)
      expect(error.message).toBe('Invalid token')
      expect(error.severity).toBe(ErrorSeverity.HIGH)
    })
  })

  describe('notFoundError', () => {
    it('should create not found error', () => {
      const error = ErrorHandler.notFoundError('User not found', { userId: '123' })

      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(error.message).toBe('User not found')
      expect(error.details).toEqual({ userId: '123' })
    })
  })

  describe('networkError', () => {
    it('should create network error', () => {
      const originalError = new Error('Connection timeout')
      const error = ErrorHandler.networkError('Database connection failed', originalError)

      expect(error.code).toBe(ErrorCode.NETWORK_ERROR)
      expect(error.message).toBe('Database connection failed')
      expect(error.details?.originalError).toBe(originalError)
    })
  })

  describe('handleError', () => {
    it('should handle Error objects', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const originalError = new Error('Test error')

      const handled = ErrorHandler.handleError(originalError)

      expect(handled.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(handled.message).toBe('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle string errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const handled = ErrorHandler.handleError('String error')

      expect(handled.code).toBe(ErrorCode.UNKNOWN_ERROR)
      expect(handled.message).toBe('String error')
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it('should handle ErrorHandler objects', () => {
      const originalError = ErrorHandler.validationError('Validation failed')

      const handled = ErrorHandler.handleError(originalError)

      expect(handled).toBe(originalError)
    })
  })

  describe('withErrorHandler', () => {
    it('should handle successful function execution', async () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true })
      const wrappedFn = ErrorHandler.withErrorHandler(mockFn)

      const mockRequest = {} as any
      const result = await wrappedFn(mockRequest)

      expect(mockFn).toHaveBeenCalledWith(mockRequest)
      expect(result).toEqual({ success: true })
    })

    it('should handle errors and return error response', async () => {
      const mockError = new Error('Test error')
      const mockFn = jest.fn().mockRejectedValue(mockError)
      const wrappedFn = ErrorHandler.withErrorHandler(mockFn)

      const mockRequest = {} as any
      const response = await wrappedFn(mockRequest)

      expect(response.constructor.name).toBe('NextResponse')
    })

    it('should handle validation errors with specific status', async () => {
      const validationError = ErrorHandler.validationError('Invalid input')
      const mockFn = jest.fn().mockRejectedValue(validationError)
      const wrappedFn = ErrorHandler.withErrorHandler(mockFn)

      const mockRequest = {} as any
      const response = await wrappedFn(mockRequest)

      expect(response.constructor.name).toBe('NextResponse')
    })
  })
})