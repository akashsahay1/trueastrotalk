/**
 * CSRF Token utility functions for client-side
 */

/**
 * Get CSRF token from cookies or localStorage
 * @returns The CSRF token or null if not found
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  // First try to get from cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf-token') {
      return decodeURIComponent(value);
    }
  }
  
  // If not in cookies, try localStorage
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('csrf-token');
    if (token) {
      return token;
    }
  }
  
  return null;
}

/**
 * Add CSRF token to fetch headers
 * @param headers Existing headers object or Headers instance
 * @returns Headers with CSRF token added
 */
export function withCSRFToken(headers: HeadersInit = {}): HeadersInit {
  const csrfToken = getCSRFToken();
  
  if (!csrfToken) {
    console.warn('CSRF token not found in cookies');
    return headers;
  }

  if (headers instanceof Headers) {
    headers.set('x-csrf-token', csrfToken);
    return headers;
  }

  return {
    ...headers,
    'x-csrf-token': csrfToken,
  };
}

/**
 * Fetch with CSRF protection
 * Automatically adds CSRF token to requests that need it
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Only add CSRF token for state-changing operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    options.headers = withCSRFToken(options.headers);
  }
  
  return fetch(url, options);
}