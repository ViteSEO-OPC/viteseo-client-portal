/**
 * Quote manifest schema for repo-driven quote pages
 */

export interface QuoteManifestItem {
  id: string
  name: string
  description?: string
  quantity: number
  unitPrice: string
  sortOrder?: number
}

export interface QuoteManifest {
  quoteNumber: string
  version: number
  validUntil: string // ISO date string
  total: string
  currency: string
  notes?: string
  items: QuoteManifestItem[]
}

export interface ClientManifest {
  companyName: string
  contactName: string
  email: string
  timezone?: string
  status?: 'active' | 'inactive' | 'archived'
}

export interface QuoteRegistryEntry {
  portalSlug: string
  quoteNumber: string
  version: number
  manifest: QuoteManifest
  routePath: string
  pagePath: string
  contentHash: string
}

export interface ClientRegistryEntry {
  portalSlug: string
  manifest: ClientManifest
  quotes: QuoteRegistryEntry[]
}

export interface DiscoveryResult {
  clients: ClientRegistryEntry[]
  errors: Array<{ path: string; error: string }>
}
