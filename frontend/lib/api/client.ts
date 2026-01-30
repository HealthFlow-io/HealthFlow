/**
 * HTTP Client Configuration
 * Axios instance with interceptors for authentication and error handling
 */

import { ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5155/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Store tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Clear tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Create headers with authentication
 */
function createHeaders(customHeaders?: HeadersInit): Headers {
  const headers = new Headers(customHeaders);
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const token = getAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return headers;
}

/**
 * Handle API errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      message: 'An error occurred',
      statusCode: response.status,
    };
    
    try {
      const errorData = await response.json();
      error.message = errorData.message || errorData.title || error.message;
      error.errors = errorData.errors;
    } catch {
      // Response is not JSON
      if (response.status === 0) {
        error.message = 'Network error. Please check if the server is running.';
      } else if (response.status === 404) {
        error.message = 'API endpoint not found. Please check the server configuration.';
      } else if (response.status >= 500) {
        error.message = 'Server error. Please try again later.';
      }
    }
    
    // Handle 401 Unauthorized - could trigger token refresh here
    if (response.status === 401) {
      clearTokens();
      // Could redirect to login or trigger refresh token flow
    }
    
    console.error('API Error:', error);
    throw error;
  }
  
  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  try {
    const parsed = JSON.parse(text);
    console.log('API Response parsed:', { url: response.url, data: parsed });
    return parsed;
  } catch (error) {
    console.error('Failed to parse JSON response:', text);
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * API Client with common HTTP methods
 */
export const apiClient = {
  /**
   * GET request
   */
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers: createHeaders(options?.headers),
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw {
        message: 'Network error. Please check if the server is running.',
        statusCode: 0,
      } as ApiError;
    }
  },

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: createHeaders(options?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw {
        message: 'Network error. Please check if the server is running.',
        statusCode: 0,
      } as ApiError;
    }
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'PUT',
        headers: createHeaders(options?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw {
        message: 'Network error. Please check if the server is running.',
        statusCode: 0,
      } as ApiError;
    }
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'PATCH',
        headers: createHeaders(options?.headers),
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw {
        message: 'Network error. Please check if the server is running.',
        statusCode: 0,
      } as ApiError;
    }
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'DELETE',
        headers: createHeaders(options?.headers),
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw {
        message: 'Network error. Please check if the server is running.',
        statusCode: 0,
      } as ApiError;
    }
  },

  /**
   * Upload file
   */
  async upload<T>(url: string, formData: FormData, options?: RequestInit): Promise<T> {
    try {
      const headers = new Headers(options?.headers);
      const token = getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      // Don't set Content-Type for FormData - browser will set it with boundary
      
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers,
        body: formData,
      });
      return handleResponse<T>(response);
    } catch (error) {
      console.error('Network error:', error);
      throw {
        message: 'Network error. Please check if the server is running.',
        statusCode: 0,
      } as ApiError;
    }
  },
};

export default apiClient;
