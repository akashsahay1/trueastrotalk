import { NextResponse } from 'next/server';
import DatabaseService from './database';

/**
 * Comprehensive Error Handling System
 * Provides consistent error responses, logging, and error classification
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_INPUT_FORMAT = 'INVALID_INPUT_FORMAT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  
  // Database
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR',
  
  // External Services
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  SMS_SERVICE_ERROR = 'SMS_SERVICE_ERROR',
  NOTIFICATION_SERVICE_ERROR = 'NOTIFICATION_SERVICE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  
  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ORDER_PROCESSING_ERROR = 'ORDER_PROCESSING_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  statusCode: number;
  userMessage?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly severity: ErrorSeverity;
  public readonly userMessage?: string;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.userMessage = userMessage;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  private static errorMapping: Map<ErrorCode, { statusCode: number; severity: ErrorSeverity }> = new Map([
    // Authentication & Authorization - 401/403
    [ErrorCode.AUTHENTICATION_REQUIRED, { statusCode: 401, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.INVALID_CREDENTIALS, { statusCode: 401, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.ACCESS_DENIED, { statusCode: 403, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.TOKEN_EXPIRED, { statusCode: 401, severity: ErrorSeverity.LOW }],
    [ErrorCode.ACCOUNT_LOCKED, { statusCode: 423, severity: ErrorSeverity.HIGH }],
    
    // Validation - 400
    [ErrorCode.VALIDATION_ERROR, { statusCode: 400, severity: ErrorSeverity.LOW }],
    [ErrorCode.MISSING_REQUIRED_FIELDS, { statusCode: 400, severity: ErrorSeverity.LOW }],
    [ErrorCode.INVALID_INPUT_FORMAT, { statusCode: 400, severity: ErrorSeverity.LOW }],
    [ErrorCode.DUPLICATE_ENTRY, { statusCode: 409, severity: ErrorSeverity.MEDIUM }],
    
    // Resource Management - 404/409/429
    [ErrorCode.RESOURCE_NOT_FOUND, { statusCode: 404, severity: ErrorSeverity.LOW }],
    [ErrorCode.RESOURCE_CONFLICT, { statusCode: 409, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.RESOURCE_LIMIT_EXCEEDED, { statusCode: 429, severity: ErrorSeverity.MEDIUM }],
    
    // Database - 500
    [ErrorCode.DATABASE_CONNECTION_ERROR, { statusCode: 503, severity: ErrorSeverity.CRITICAL }],
    [ErrorCode.DATABASE_QUERY_ERROR, { statusCode: 500, severity: ErrorSeverity.HIGH }],
    [ErrorCode.DATABASE_TRANSACTION_ERROR, { statusCode: 500, severity: ErrorSeverity.HIGH }],
    
    // External Services - 502/503
    [ErrorCode.PAYMENT_GATEWAY_ERROR, { statusCode: 502, severity: ErrorSeverity.HIGH }],
    [ErrorCode.EMAIL_SERVICE_ERROR, { statusCode: 502, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.SMS_SERVICE_ERROR, { statusCode: 502, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.NOTIFICATION_SERVICE_ERROR, { statusCode: 502, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.FILE_UPLOAD_ERROR, { statusCode: 500, severity: ErrorSeverity.MEDIUM }],
    
    // Business Logic - 400/402/409
    [ErrorCode.INSUFFICIENT_BALANCE, { statusCode: 402, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.ORDER_PROCESSING_ERROR, { statusCode: 409, severity: ErrorSeverity.HIGH }],
    [ErrorCode.SESSION_EXPIRED, { statusCode: 410, severity: ErrorSeverity.LOW }],
    [ErrorCode.RATE_LIMIT_EXCEEDED, { statusCode: 429, severity: ErrorSeverity.MEDIUM }],
    
    // System - 500/503
    [ErrorCode.INTERNAL_SERVER_ERROR, { statusCode: 500, severity: ErrorSeverity.HIGH }],
    [ErrorCode.SERVICE_UNAVAILABLE, { statusCode: 503, severity: ErrorSeverity.HIGH }],
    [ErrorCode.MAINTENANCE_MODE, { statusCode: 503, severity: ErrorSeverity.MEDIUM }],
    
    // Network - 408/502
    [ErrorCode.NETWORK_ERROR, { statusCode: 502, severity: ErrorSeverity.MEDIUM }],
    [ErrorCode.TIMEOUT_ERROR, { statusCode: 408, severity: ErrorSeverity.MEDIUM }]
  ]);

  static createError(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    details?: Record<string, unknown>
  ): AppError {
    const mapping = this.errorMapping.get(code);
    return new AppError(
      code,
      message,
      mapping?.statusCode || 500,
      mapping?.severity || ErrorSeverity.MEDIUM,
      userMessage,
      details
    );
  }

  static async handleError(
    error: Error | AppError,
    request?: Request,
    context?: {
      userId?: string;
      endpoint?: string;
      method?: string;
    }
  ): Promise<NextResponse> {
    const errorDetails: ErrorDetails = {
      code: error instanceof AppError ? error.code : ErrorCode.INTERNAL_SERVER_ERROR,
      message: error.message,
      severity: error instanceof AppError ? error.severity : ErrorSeverity.HIGH,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      userMessage: error instanceof AppError ? error.userMessage : 'An unexpected error occurred',
      details: error instanceof AppError ? error.details : undefined,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId(),
      userId: context?.userId,
      endpoint: context?.endpoint || request?.url,
      method: context?.method || request?.method,
      userAgent: request?.headers.get('user-agent') || undefined,
      ip: this.getClientIP(request)
    };

    // Log error based on severity
    await this.logError(errorDetails, error);

    // Send notification for critical errors
    if (errorDetails.severity === ErrorSeverity.CRITICAL) {
      await this.notifyCriticalError(errorDetails);
    }

    // Return appropriate response
    return this.createErrorResponse(errorDetails);
  }

  private static async logError(errorDetails: ErrorDetails, originalError: Error): Promise<void> {
    try {
      // Log to console with appropriate level
      const logMethod = this.getLogMethod(errorDetails.severity);
      logMethod(`[${errorDetails.code}] ${errorDetails.message}`, {
        ...errorDetails,
        stack: originalError.stack
      });

      // Log to database for tracking and analytics
      if (errorDetails.severity === ErrorSeverity.HIGH || errorDetails.severity === ErrorSeverity.CRITICAL) {
        await this.logToDatabase(errorDetails, originalError);
      }

    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private static async logToDatabase(errorDetails: ErrorDetails, originalError: Error): Promise<void> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      await errorLogsCollection.insertOne({
        ...errorDetails,
        stack_trace: originalError.stack,
        created_at: new Date(),
        resolved: false
      });
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  }

  private static async notifyCriticalError(errorDetails: ErrorDetails): Promise<void> {
    try {
      // This would integrate with your notification system
      // For now, just log critical errors prominently
      console.error('🚨 CRITICAL ERROR 🚨', errorDetails);
      
      // TODO: Send email/Slack notification to administrators
      // TODO: Trigger alerting system
      
    } catch (notificationError) {
      console.error('Failed to send critical error notification:', notificationError);
    }
  }

  private static createErrorResponse(errorDetails: ErrorDetails): NextResponse {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response = {
      success: false,
      error: errorDetails.code,
      message: errorDetails.userMessage || errorDetails.message,
      ...(isDevelopment && {
        details: errorDetails.details,
        timestamp: errorDetails.timestamp,
        requestId: errorDetails.requestId
      })
    };

    return NextResponse.json(response, { 
      status: errorDetails.statusCode,
      headers: {
        'X-Request-ID': errorDetails.requestId || '',
        'X-Error-Code': errorDetails.code
      }
    });
  }

  private static getLogMethod(severity: ErrorSeverity): (...args: unknown[]) => void {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getClientIP(request?: Request): string | undefined {
    if (!request) return undefined;
    
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      undefined
    );
  }

  // Utility methods for common error scenarios
  static validationError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError(ErrorCode.VALIDATION_ERROR, message, 'Please check your input and try again', details);
  }

  static authenticationRequired(message: string = 'Authentication required'): AppError {
    return this.createError(ErrorCode.AUTHENTICATION_REQUIRED, message, 'Please log in to continue');
  }

  static accessDenied(message: string = 'Access denied'): AppError {
    return this.createError(ErrorCode.ACCESS_DENIED, message, 'You do not have permission to perform this action');
  }

  static resourceNotFound(resource: string): AppError {
    return this.createError(
      ErrorCode.RESOURCE_NOT_FOUND, 
      `${resource} not found`, 
      `The requested ${resource.toLowerCase()} could not be found`
    );
  }

  static databaseError(message: string, query?: string): AppError {
    return this.createError(
      ErrorCode.DATABASE_QUERY_ERROR, 
      message, 
      'A database error occurred. Please try again later',
      { query }
    );
  }

  static paymentError(message: string, details?: Record<string, unknown>): AppError {
    return this.createError(
      ErrorCode.PAYMENT_GATEWAY_ERROR, 
      message, 
      'Payment processing failed. Please try again',
      details
    );
  }

  static insufficientBalance(): AppError {
    return this.createError(
      ErrorCode.INSUFFICIENT_BALANCE, 
      'Insufficient balance', 
      'You do not have sufficient balance to complete this transaction'
    );
  }
}

// Middleware for wrapping API routes with error handling
export function withErrorHandler(
  handler: (request: Request, context?: unknown) => Promise<NextResponse>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('Unhandled error in API route:', error);
      
      return ErrorHandler.handleError(
        error instanceof Error ? error : new Error('Unknown error'),
        request,
        {
          endpoint: request.url,
          method: request.method
        }
      );
    }
  };
}

export default ErrorHandler;