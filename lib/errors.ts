export type ErrorCode =
  | 'INVALID_OTP'
  | 'OTP_LOCKED'
  | 'CSRF_INVALID'
  | 'RATE_LIMITED'
  | 'SESSION_EXPIRED'
  | 'SESSION_INVALID'
  | 'QUOTE_NOT_FOUND'
  | 'QUOTE_EXPIRED'
  | 'QUOTE_ALREADY_ACTIONED'
  | 'PDF_GENERATION_FAILED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'CODE_INVALID'

interface ErrorResponse {
  error: {
    code: ErrorCode
    message: string
    requestId?: string
  }
}

export const ERROR_MESSAGES: Record<ErrorCode, { status: number; message: string }> = {
  INVALID_OTP: { status: 404, message: 'Invalid or expired access code' }, // 404 to avoid info leakage
  OTP_LOCKED: { status: 429, message: 'Too many failed attempts. Please try again later.' },
  CSRF_INVALID: { status: 403, message: 'Invalid request. Please refresh and try again.' },
  RATE_LIMITED: { status: 429, message: 'Too many attempts. Please try again later' },
  SESSION_EXPIRED: { status: 404, message: 'Your session has expired. Please enter your access code again' }, // 404 to avoid info leakage
  SESSION_INVALID: { status: 404, message: 'Session not found' }, // 404 to avoid info leakage
  QUOTE_NOT_FOUND: { status: 404, message: 'Quote not found' },
  QUOTE_EXPIRED: { status: 410, message: 'This quote has expired' },
  QUOTE_ALREADY_ACTIONED: { status: 400, message: 'This quote has already been accepted or rejected' },
  PDF_GENERATION_FAILED: { status: 500, message: 'Failed to generate PDF. Please try again' },
  UNAUTHORIZED: { status: 404, message: 'Not found' }, // 404 to avoid info leakage per security spec
  NOT_FOUND: { status: 404, message: 'Not found' },
  VALIDATION_ERROR: { status: 400, message: 'Invalid request data' },
  INTERNAL_ERROR: { status: 500, message: 'An unexpected error occurred' },
  CODE_INVALID: { status: 404, message: 'Invalid access code' }, // 404 to avoid info leakage
}

export function createErrorResponse(code: ErrorCode, requestId?: string): Response {
  const { status, message } = ERROR_MESSAGES[code]
  const body: ErrorResponse = {
    error: {
      code,
      message,
      requestId,
    },
  }
  return Response.json(body, { status })
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string
  ) {
    super(message || ERROR_MESSAGES[code].message)
    this.name = 'AppError'
  }
}
