/**
 * API response types for TanStack Query hooks
 */

// Client list response (from GET /api/admin/clients)
export interface ClientListItem {
  id: string
  companyName: string
  contactName: string
  portalSlug: string
  status: 'active' | 'inactive' | 'archived'
  timezone: string
  createdAt: string
  _count: {
    quotes: number
    accessCodes: number
  }
}

// Client detail response (from GET /api/admin/clients/[id])
export interface ClientDetail {
  id: string
  companyName: string
  contactName: string
  email: string
  portalSlug: string
  status: 'active' | 'inactive' | 'archived'
  timezone: string
  createdAt: string
  updatedAt: string
  quotes: QuoteListItem[]
  accessCodes: AccessCodeListItem[]
  _count: {
    quotes: number
    accessCodes: number
    sessions: number
  }
}

// Quote list response (from GET /api/admin/quotes)
export interface QuoteListItem {
  id: string
  quoteNumber: string
  version: number
  status: QuoteStatus
  total: string | number
  validUntil: string
  createdAt: string
  clientId: string
  client?: {
    companyName: string
  }
  items?: QuoteItemData[]
}

// Quote detail response (from GET /api/admin/quotes/[id])
export interface QuoteDetail {
  id: string
  quoteNumber: string
  version: number
  status: QuoteStatus
  validUntil: string
  total: string
  notes: string | null
  contentHash: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    companyName: string
    contactName: string
    portalSlug: string
    timezone: string
  }
  items: QuoteItemData[]
  accessCodes: AccessCodeListItem[]
}

export interface QuoteItemData {
  id: string
  name: string
  description: string | null
  quantity: number
  unitPrice: string
  sortOrder: number
}

export interface AccessCodeListItem {
  id: string
  codeHint: string
  expiresAt: string
  usedCount: number
  maxUses: number
  revokedAt: string | null
  createdAt: string
}

// Mutation payloads
export interface CreateClientPayload {
  companyName: string
  contactName: string
  email: string
  portalSlug: string
  timezone?: string
}

export interface UpdateClientPayload {
  companyName?: string
  contactName?: string
  email?: string
  portalSlug?: string
  timezone?: string
  status?: 'active' | 'inactive' | 'archived'
}

export interface CreateQuotePayload {
  clientId: string
  validUntil: string
  items: {
    name: string
    description?: string
    quantity: number
    unitPrice: number
  }[]
}

export interface UpdateQuotePayload {
  validUntil?: string
  notes?: string
  status?: 'draft' | 'sent' | 'expired' | 'superseded'
}

export interface AddQuoteItemPayload {
  name: string
  description?: string
  quantity: number
  unitPrice: number
}

export interface UpdateQuoteItemPayload {
  name?: string
  description?: string
  quantity?: number
  unitPrice?: number
  sortOrder?: number
}

export interface GenerateAccessCodePayload {
  clientId: string
  quoteId?: string
  expiresInHours?: number
  maxUses?: number
}

export interface GenerateAccessCodeResponse {
  id: string
  code: string
  codeHint: string
  expiresAt: string
  maxUses: number
  portalUrl: string
}

// Portal types
export interface PortalQuoteResponse {
  id: string
  quoteNumber: string
  version: number
  validUntil: string
  total: string
  status: QuoteStatus
  items: {
    id: string
    name: string
    description: string | null
    quantity: number
    unitPrice: string
  }[]
}

export interface VerifyCodePayload {
  code: string
}

export interface VerifyCodeResponse {
  success: boolean
  redirect: string
  csrfToken?: string
}

export interface PDFGenerateResponse {
  success: boolean
  downloadUrl: string
  expiresIn: number
}

export interface QuoteActionResponse {
  success: boolean
  message: string
}

// Quote status type
export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'superseded'
