'use client';

import React from 'react';

/**
 * Client-side Error Handling System
 * Provides consistent error handling for React components and API calls
 */

interface ErrorWithAdditionalInfo extends Error {
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface APIError {
  success: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export class ClientErrorHandler {
  /**
   * Handle API response and throw appropriate errors
   */
  static async handleAPIResponse<T>(response: Response): Promise<T> {
    let data: APIResponse<T>;
    
    try {
      data = await response.json();
    } catch {
      throw new Error('Invalid response format from server');
    }

    if (!response.ok || !data.success) {
      const errorMessage = data.message || data.error || 'An error occurred';
      const error = new Error(errorMessage);
      
      // Add additional error properties
      (error as ErrorWithAdditionalInfo).code = data.error;
      (error as ErrorWithAdditionalInfo).status = response.status;
      (error as ErrorWithAdditionalInfo).details = data.details;
      
      throw error;
    }

    return data.data as T;
  }

  /**
   * Make authenticated API requests with error handling
   */
  static async apiRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      return await this.handleAPIResponse<T>(response);
    } catch (error) {
      // Log error for debugging
      console.error(`API Request failed: ${options.method || 'GET'} ${url}`, error);
      
      // Re-throw for component handling
      throw this.processError(error);
    }
  }

  /**
   * Process and categorize errors
   */
  static processError(error: unknown): Error {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Error('Network error. Please check your connection and try again.');
    }

    // Authentication errors
    if ((error as ErrorWithAdditionalInfo).status === 401) {
      return new Error('Your session has expired. Please log in again.');
    }

    // Authorization errors
    if ((error as ErrorWithAdditionalInfo).status === 403) {
      return new Error('You do not have permission to perform this action.');
    }

    // Not found errors
    if ((error as ErrorWithAdditionalInfo).status === 404) {
      return new Error('The requested resource was not found.');
    }

    // Validation errors
    if ((error as ErrorWithAdditionalInfo).status === 400 && (error as ErrorWithAdditionalInfo).details) {
      const validationErrors = Object.values((error as ErrorWithAdditionalInfo).details || {}).join(', ');
      return new Error(`Validation error: ${validationErrors}`);
    }

    // Rate limiting
    if ((error as ErrorWithAdditionalInfo).status === 429) {
      return new Error('Too many requests. Please wait a moment and try again.');
    }

    // Server errors
    const errorStatus = (error as ErrorWithAdditionalInfo).status;
    if (errorStatus && errorStatus >= 500) {
      return new Error('Server error. Please try again later.');
    }

    // Return original error if it's already a proper Error object
    if (error instanceof Error) {
      return error;
    }

    // Fallback for unknown errors
    return new Error('An unexpected error occurred. Please try again.');
  }

  /**
   * Show user-friendly error messages
   */
  static showError(error: unknown, options: {
    title?: string;
    duration?: number;
    showDetails?: boolean;
  } = {}) {
    const processedError = this.processError(error);
    
    // In a real app, you might integrate with a toast/notification library
    console.error('User Error:', processedError.message);
    
    // For now, just alert (replace with your preferred notification system)
    if (typeof window !== 'undefined') {
      alert(`${options.title || 'Error'}: ${processedError.message}`);
    }
  }

  /**
   * Handle form submission errors
   */
  static handleFormError(error: unknown, setFieldError?: (field: string, message: string) => void) {
    const processedError = this.processError(error);
    
    // If error has field-specific details, set individual field errors
    if ((error as ErrorWithAdditionalInfo).details && setFieldError) {
      Object.entries((error as ErrorWithAdditionalInfo).details || {}).forEach(([field, message]) => {
        setFieldError(field, message as string);
      });
    } else {
      // Show general error
      this.showError(processedError, { title: 'Form Error' });
    }
  }

  /**
   * Retry mechanism for failed requests
   */
  static async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = this.processError(error);
        
        // Don't retry for certain error types
        if ((error as ErrorWithAdditionalInfo).status === 400 || (error as ErrorWithAdditionalInfo).status === 401 || (error as ErrorWithAdditionalInfo).status === 403) {
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Create a wrapper for React components to handle errors
   */
  static withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  ) {
    return class ErrorBoundaryWrapper extends React.Component<
      P,
      { hasError: boolean; error: Error | null }
    > {
      constructor(props: P) {
        super(props);
        this.state = { hasError: false, error: null };
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Component Error:', error, errorInfo);
        
        // Log error to monitoring service
        // ClientErrorHandler.logError(error, errorInfo);
      }

      retry = () => {
        this.setState({ hasError: false, error: null });
      };

      render() {
        if (this.state.hasError && this.state.error) {
          if (fallback) {
            return React.createElement(fallback, {
              error: this.state.error,
              retry: this.retry
            });
          }

          return React.createElement('div', {
            className: 'error-boundary'
          }, 
            React.createElement('h2', { key: 'title' }, 'Something went wrong'),
            React.createElement('p', { key: 'message' }, this.state.error.message),
            React.createElement('button', {
              key: 'retry',
              onClick: this.retry
            }, 'Try Again')
          );
        }

        return React.createElement(Component, this.props);
      }
    };
  }
}

/**
 * React hook for handling async operations with error states
 */
export function useAsyncOperation<T>() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<T | null>(null);

  const execute = React.useCallback(async (operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const processedError = ClientErrorHandler.processError(err);
      setError(processedError);
      throw processedError;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = React.useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { loading, error, data, execute, reset };
}

/**
 * React hook for API requests
 */
export function useAPI<T>(
  url: string,
  options?: RequestInit,
  dependencies: React.DependencyList = []
) {
  const { loading, error, data, execute } = useAsyncOperation<T>();

  React.useEffect(() => {
    if (url) {
      execute(() => ClientErrorHandler.apiRequest<T>(url, options));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, execute, options, ...dependencies]);

  const refetch = React.useCallback(() => {
    if (url) {
      return execute(() => ClientErrorHandler.apiRequest<T>(url, options));
    }
    return Promise.reject(new Error('No URL provided'));
  }, [url, execute, options]);

  return { loading, error, data, refetch };
}

export default ClientErrorHandler;