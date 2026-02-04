import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { api, setCSRFToken } from '../api'
import type {
  PortalQuoteResponse,
  PDFGenerateResponse,
  QuoteActionResponse,
} from '../types'

// ============================================================================
// QUOTE ACTION HOOKS
// ============================================================================

/**
 * Accept a quote
 * Requires CSRF token from session
 */
export function useAcceptQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<QuoteActionResponse>('/api/portal/quote/accept', undefined, true),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.portal.quote() })

      // Snapshot previous value
      const previousQuote = queryClient.getQueryData<PortalQuoteResponse>(
        queryKeys.portal.quote()
      )

      // Optimistically update status
      if (previousQuote) {
        queryClient.setQueryData<PortalQuoteResponse>(queryKeys.portal.quote(), {
          ...previousQuote,
          status: 'accepted',
        })
      }

      return { previousQuote }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousQuote) {
        queryClient.setQueryData(queryKeys.portal.quote(), context.previousQuote)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.quote() })
    },
  })
}

/**
 * Reject a quote
 * Requires CSRF token from session
 */
export function useRejectQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<QuoteActionResponse>('/api/portal/quote/reject', undefined, true),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.portal.quote() })

      // Snapshot previous value
      const previousQuote = queryClient.getQueryData<PortalQuoteResponse>(
        queryKeys.portal.quote()
      )

      // Optimistically update status
      if (previousQuote) {
        queryClient.setQueryData<PortalQuoteResponse>(queryKeys.portal.quote(), {
          ...previousQuote,
          status: 'rejected',
        })
      }

      return { previousQuote }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousQuote) {
        queryClient.setQueryData(queryKeys.portal.quote(), context.previousQuote)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.portal.quote() })
    },
  })
}

// ============================================================================
// PDF GENERATION HOOK
// ============================================================================

/**
 * Generate PDF download
 * Returns a download URL that expires
 */
export function useGeneratePDF() {
  return useMutation({
    mutationFn: () =>
      api.post<PDFGenerateResponse>('/api/portal/pdf', undefined, true),
    onSuccess: (data) => {
      // Open the PDF in a new tab/window
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }
    },
  })
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

interface VerifyCodePayload {
  code: string
}

interface VerifyCodeResponse {
  success: boolean
  redirect: string
  csrfToken?: string
}

/**
 * Verify OTP code
 * On success, stores CSRF token and returns redirect URL
 */
export function useVerifyCode() {
  return useMutation({
    mutationFn: (data: VerifyCodePayload) =>
      api.post<VerifyCodeResponse>('/api/auth/verify-code', data, false),
    onSuccess: (data) => {
      // Store CSRF token for subsequent authenticated requests
      if (data.csrfToken) {
        setCSRFToken(data.csrfToken)
      }
    },
  })
}
