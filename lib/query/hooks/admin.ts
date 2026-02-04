import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { api } from '../api'
import type {
  ClientListItem,
  ClientDetail,
  CreateClientPayload,
  UpdateClientPayload,
  QuoteListItem,
  QuoteDetail,
  CreateQuotePayload,
  UpdateQuotePayload,
  GenerateAccessCodePayload,
  GenerateAccessCodeResponse,
} from '../types'

// ============================================================================
// CLIENT HOOKS
// ============================================================================

/**
 * Fetch all clients
 */
export function useClients(
  options?: Omit<UseQueryOptions<ClientListItem[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.clients.lists(),
    queryFn: () => api.get<ClientListItem[]>('/api/admin/clients'),
    ...options,
  })
}

/**
 * Fetch a single client by ID
 */
export function useClient(
  id: string,
  options?: Omit<UseQueryOptions<ClientDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => api.get<ClientDetail>(`/api/admin/clients/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a new client
 */
export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientPayload) =>
      api.post<ClientListItem>('/api/admin/clients', data, false), // Admin routes don't need CSRF
    onSuccess: () => {
      // Invalidate clients list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

/**
 * Update an existing client
 */
export function useUpdateClient(clientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateClientPayload) =>
      api.put<ClientListItem>(`/api/admin/clients/${clientId}`, data, false),
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.clients.detail(clientId),
      })

      // Snapshot previous value
      const previousClient = queryClient.getQueryData<ClientDetail>(
        queryKeys.clients.detail(clientId)
      )

      // Optimistically update
      if (previousClient) {
        queryClient.setQueryData<ClientDetail>(
          queryKeys.clients.detail(clientId),
          { ...previousClient, ...newData }
        )
      }

      return { previousClient }
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousClient) {
        queryClient.setQueryData(
          queryKeys.clients.detail(clientId),
          context.previousClient
        )
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: queryKeys.clients.detail(clientId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

/**
 * Delete (archive) a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) =>
      api.delete<{ success: boolean }>(`/api/admin/clients/${clientId}`, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

// ============================================================================
// QUOTE HOOKS
// ============================================================================

/**
 * Fetch all quotes with optional client filter
 */
export function useQuotes(
  filters?: { clientId?: string },
  options?: Omit<UseQueryOptions<QuoteListItem[]>, 'queryKey' | 'queryFn'>
) {
  const queryString = filters?.clientId ? `?clientId=${filters.clientId}` : ''

  return useQuery({
    queryKey: queryKeys.quotes.list(filters),
    queryFn: () => api.get<QuoteListItem[]>(`/api/admin/quotes${queryString}`),
    ...options,
  })
}

/**
 * Fetch a single quote by ID
 */
export function useQuote(
  id: string,
  options?: Omit<UseQueryOptions<QuoteDetail>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.quotes.detail(id),
    queryFn: () => api.get<QuoteDetail>(`/api/admin/quotes/${id}`),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create a new quote
 */
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateQuotePayload) =>
      api.post<QuoteDetail>('/api/admin/quotes', data, false),
    onSuccess: (data) => {
      // Invalidate quotes list
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.lists() })
      // Also invalidate the client's detail if we have the clientId
      if (data.client?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.clients.detail(data.client.id),
        })
      }
    },
  })
}

/**
 * Update a quote (validUntil, notes, etc.)
 */
export function useUpdateQuote(quoteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateQuotePayload) =>
      api.put<QuoteDetail>(`/api/admin/quotes/${quoteId}`, data, false),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.detail(quoteId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.lists() })
    },
  })
}

/**
 * Send a quote (change status to 'sent')
 */
export function useSendQuote(quoteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.patch<QuoteDetail>(
        `/api/admin/quotes/${quoteId}`,
        { status: 'sent' },
        false
      ),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.quotes.detail(quoteId),
      })

      // Snapshot previous value
      const previousQuote = queryClient.getQueryData<QuoteDetail>(
        queryKeys.quotes.detail(quoteId)
      )

      // Optimistically update status
      if (previousQuote) {
        queryClient.setQueryData<QuoteDetail>(
          queryKeys.quotes.detail(quoteId),
          { ...previousQuote, status: 'sent' }
        )
      }

      return { previousQuote }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousQuote) {
        queryClient.setQueryData(
          queryKeys.quotes.detail(quoteId),
          context.previousQuote
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotes.detail(quoteId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes.lists() })
    },
  })
}

// ============================================================================
// ACCESS CODE HOOKS
// ============================================================================

/**
 * Generate a new access code
 */
export function useGenerateAccessCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: GenerateAccessCodePayload) =>
      api.post<GenerateAccessCodeResponse>('/api/admin/access-codes', data, false),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      if (variables.clientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.clients.detail(variables.clientId),
        })
      }
      if (variables.quoteId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.quotes.detail(variables.quoteId),
        })
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.accessCodes.lists(),
      })
    },
  })
}
