import { ClientStatus, QuoteStatus } from '@prisma/client'

export interface Client {
  id: string
  companyName: string
  contactName: string
  email: string
  portalSlug: string
  status: ClientStatus
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface Quote {
  id: string
  clientId: string
  quoteNumber: string
  version: number
  previousQuoteId: string | null
  status: QuoteStatus
  validUntil: Date
  total: number
  contentHash: string | null
  createdAt: Date
  updatedAt: Date
  items?: QuoteItem[]
}

export interface QuoteItem {
  id: string
  quoteId: string
  name: string
  description: string | null
  quantity: number
  unitPrice: number
  createdAt: Date
}

export interface AccessCode {
  id: string
  clientId: string
  quoteId: string | null
  codeHint: string
  expiresAt: Date
  maxUses: number
  usedCount: number
  failedAttempts: number
  lockedUntil: Date | null
  revokedAt: Date | null
  revokedBy: string | null
  createdAt: Date
}

export interface Session {
  id: string
  clientId: string
  accessCodeId: string
  ipAddress: string
  userAgent: string | null
  expiresAt: Date
  revokedAt: Date | null
  createdAt: Date
}

export interface AuditLog {
  id: string
  eventType: string
  actorType: 'client' | 'admin' | 'system' | 'anonymous'
  actorId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  ipAddress: string | null
  userAgent: string | null
  meta: Record<string, unknown> | null
  createdAt: Date
}

export interface APIErrorResponse {
  error: {
    code: string
    message: string
    requestId?: string
  }
}
