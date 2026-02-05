/**
 * Query key factory for consistent cache key management
 * Following the factory pattern recommended by TanStack Query
 */
export const queryKeys = {
  // Client keys
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters?: { status?: string }) =>
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },

  // Quote keys
  quotes: {
    all: ['quotes'] as const,
    lists: () => [...queryKeys.quotes.all, 'list'] as const,
    list: (filters?: { clientId?: string; status?: string }) =>
      [...queryKeys.quotes.lists(), filters] as const,
    details: () => [...queryKeys.quotes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quotes.details(), id] as const,
  },

  // Access code keys
  accessCodes: {
    all: ['accessCodes'] as const,
    lists: () => [...queryKeys.accessCodes.all, 'list'] as const,
    list: (filters?: { clientId?: string; active?: string }) =>
      [...queryKeys.accessCodes.lists(), filters] as const,
  },

  // Audit log keys
  auditLogs: {
    all: ['auditLogs'] as const,
    lists: () => [...queryKeys.auditLogs.all, 'list'] as const,
    list: (filters?: { eventType?: string; actorType?: string }) =>
      [...queryKeys.auditLogs.lists(), filters] as const,
  },

  // Session keys (admin view)
  sessions: {
    all: ['sessions'] as const,
    lists: () => [...queryKeys.sessions.all, 'list'] as const,
    list: (filters?: { clientId?: string; active?: string }) =>
      [...queryKeys.sessions.lists(), filters] as const,
  },

  // Portal keys (client-side portal)
  portal: {
    all: ['portal'] as const,
    quote: () => [...queryKeys.portal.all, 'quote'] as const,
    me: () => [...queryKeys.portal.all, 'me'] as const,
  },

  // Auth keys
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Message keys
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (quoteId: string) => [...queryKeys.messages.lists(), quoteId] as const,
    portalUnreadCount: () => [...queryKeys.messages.all, 'portal-unread-count'] as const,
    adminUnreadCounts: () => [...queryKeys.messages.all, 'admin-unread-counts'] as const,
  },
} as const

// Type helpers for query keys
export type ClientsQueryKey = ReturnType<typeof queryKeys.clients.list>
export type ClientDetailQueryKey = ReturnType<typeof queryKeys.clients.detail>
export type QuotesQueryKey = ReturnType<typeof queryKeys.quotes.list>
export type QuoteDetailQueryKey = ReturnType<typeof queryKeys.quotes.detail>
