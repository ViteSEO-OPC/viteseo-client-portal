import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '../keys'
import { api } from '../api'

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
  id: string
  senderType: 'client' | 'admin'
  senderId?: string
  content: string
  isRead: boolean
  readAt?: string | null
  createdAt: string
}

interface MessagesResponse {
  messages: Message[]
  quoteId: string
}

interface UnreadCountResponse {
  count: number
}

interface AdminUnreadCountsResponse {
  counts: Record<string, number>
  total: number
}

interface MarkReadResponse {
  success: boolean
  markedAsRead: number
}

interface SendMessagePayload {
  content: string
}

// ============================================================================
// PORTAL HOOKS (Client-side)
// ============================================================================

/**
 * Fetch messages for the client's current quote with polling
 */
export function usePortalMessages(options?: { pollingInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.messages.lists(),
    queryFn: () => api.get<MessagesResponse>('/api/portal/messages'),
    refetchInterval: options?.pollingInterval ?? 4000,
  })
}

/**
 * Send a message as a client
 */
export function useSendPortalMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessagePayload) =>
      api.post<Message>('/api/portal/messages', data, true),
    onSuccess: (newMessage) => {
      // Optimistically add the message to the list
      queryClient.setQueryData<MessagesResponse>(
        queryKeys.messages.lists(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            messages: [...old.messages, newMessage],
          }
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.lists() })
    },
  })
}

/**
 * Get unread message count for portal badge
 */
export function usePortalUnreadCount(options?: { pollingInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.messages.portalUnreadCount(),
    queryFn: () => api.get<UnreadCountResponse>('/api/portal/messages/unread-count'),
    refetchInterval: options?.pollingInterval ?? 10000,
  })
}

/**
 * Mark admin messages as read (client-side)
 */
export function useMarkPortalMessagesRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<MarkReadResponse>('/api/portal/messages/read', undefined, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.portalUnreadCount() })
      // Update local messages to show as read
      queryClient.setQueryData<MessagesResponse>(
        queryKeys.messages.lists(),
        (old) => {
          if (!old) return old
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.senderType === 'admin' ? { ...msg, isRead: true } : msg
            ),
          }
        }
      )
    },
  })
}

// ============================================================================
// ADMIN HOOKS
// ============================================================================

/**
 * Fetch messages for a specific quote (admin)
 */
export function useAdminMessages(quoteId: string, options?: { pollingInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.messages.list(quoteId),
    queryFn: () => api.get<MessagesResponse>(`/api/admin/messages/${quoteId}`),
    enabled: !!quoteId,
    refetchInterval: options?.pollingInterval ?? 4000,
  })
}

/**
 * Send a message as admin
 */
export function useSendAdminMessage(quoteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SendMessagePayload) =>
      api.post<Message>(`/api/admin/messages/${quoteId}`, data, false),
    onSuccess: (newMessage) => {
      // Optimistically add the message to the list
      queryClient.setQueryData<MessagesResponse>(
        queryKeys.messages.list(quoteId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            messages: [...old.messages, newMessage],
          }
        }
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(quoteId) })
    },
  })
}

/**
 * Get unread counts for all quotes (admin dashboard)
 */
export function useAdminUnreadCounts(options?: { pollingInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.messages.adminUnreadCounts(),
    queryFn: () => api.get<AdminUnreadCountsResponse>('/api/admin/messages/unread-counts'),
    refetchInterval: options?.pollingInterval ?? 10000,
  })
}

/**
 * Mark client messages as read (admin-side)
 */
export function useMarkAdminMessagesRead(quoteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<MarkReadResponse>(`/api/admin/messages/${quoteId}/read`, undefined, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.adminUnreadCounts() })
      // Update local messages to show as read
      queryClient.setQueryData<MessagesResponse>(
        queryKeys.messages.list(quoteId),
        (old) => {
          if (!old) return old
          return {
            ...old,
            messages: old.messages.map((msg) =>
              msg.senderType === 'client' ? { ...msg, isRead: true, readAt: new Date().toISOString() } : msg
            ),
          }
        }
      )
    },
  })
}
