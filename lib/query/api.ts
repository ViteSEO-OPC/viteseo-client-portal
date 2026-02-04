/**
 * API utilities for TanStack Query
 * Provides typed fetch wrappers with error handling and CSRF token injection
 */

// Error response structure from our API
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    requestId?: string
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public requestId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Get CSRF token from cookie or storage
function getCSRFToken(): string | null {
  // Check if we're in the browser
  if (typeof window === 'undefined') return null

  // Try to get from a meta tag or local storage
  // The token is passed from the server on initial load
  const meta = document.querySelector('meta[name="csrf-token"]')
  if (meta) {
    return meta.getAttribute('content')
  }

  // Try localStorage as fallback
  return localStorage.getItem('csrf-token')
}

// Store CSRF token for subsequent requests
export function setCSRFToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('csrf-token', token)
  }
}

// Clear CSRF token
export function clearCSRFToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('csrf-token')
  }
}

// Base fetch wrapper with error handling
async function baseFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Handle non-OK responses
  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null
    try {
      errorData = await response.json()
    } catch {
      // Response is not JSON
    }

    throw new ApiError(
      errorData?.error?.code || 'UNKNOWN_ERROR',
      errorData?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      errorData?.error?.requestId
    )
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return null as T
}

/**
 * Fetch wrapper for GET requests (queries)
 */
export async function fetchQuery<T>(url: string): Promise<T> {
  return baseFetch<T>(url, {
    method: 'GET',
  })
}

/**
 * Fetch wrapper for mutations (POST/PUT/PATCH/DELETE)
 * Automatically includes CSRF token for authenticated requests
 */
export async function fetchMutation<T, TBody = unknown>(
  url: string,
  options: {
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: TBody
    includeCSRF?: boolean
  }
): Promise<T> {
  const headers: Record<string, string> = {}

  // Include CSRF token for mutations if available
  if (options.includeCSRF !== false) {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }
  }

  return baseFetch<T>(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

// Shorthand mutation helpers
export const api = {
  get: <T>(url: string) => fetchQuery<T>(url),
  
  post: <T, TBody = unknown>(url: string, body?: TBody, includeCSRF = true) =>
    fetchMutation<T, TBody>(url, { method: 'POST', body, includeCSRF }),
  
  put: <T, TBody = unknown>(url: string, body?: TBody, includeCSRF = true) =>
    fetchMutation<T, TBody>(url, { method: 'PUT', body, includeCSRF }),
  
  patch: <T, TBody = unknown>(url: string, body?: TBody, includeCSRF = true) =>
    fetchMutation<T, TBody>(url, { method: 'PATCH', body, includeCSRF }),
  
  delete: <T>(url: string, includeCSRF = true) =>
    fetchMutation<T>(url, { method: 'DELETE', includeCSRF }),
}
