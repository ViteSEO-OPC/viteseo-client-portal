// Admin hooks
export {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useQuotes,
  useQuote,
  useCreateQuote,
  useUpdateQuote,
  useSendQuote,
  useGenerateAccessCode,
  useRevokeAccessCode,
  useAuditLogs,
  useSessions,
  useRevokeSession,
} from './admin'

// Portal hooks
export {
  useAcceptQuote,
  useRejectQuote,
  useGeneratePDF,
  useVerifyCode,
} from './portal'

// Message hooks
export {
  usePortalMessages,
  useSendPortalMessage,
  usePortalUnreadCount,
  useMarkPortalMessagesRead,
  useAdminMessages,
  useSendAdminMessage,
  useAdminUnreadCounts,
  useMarkAdminMessagesRead,
} from './messages'

export type { Message } from './messages'
