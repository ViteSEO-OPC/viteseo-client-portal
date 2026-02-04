/**
 * Quote registry module
 * Maps quote routes to components for dynamic rendering
 */

import type { QuoteRegistryEntry, ClientManifest } from './types'
import { discoverQuotes, getClientManifest } from './discovery'

export interface QuoteRouteInfo {
  portalSlug: string
  quoteNumber: string
  version: number
  routePath: string
  hasCustomPage: boolean
  contentHash: string
}

export interface RegistryState {
  quotes: Map<string, QuoteRegistryEntry>
  clients: Map<string, ClientManifest>
  lastUpdated: Date
}

// In-memory registry cache
let registry: RegistryState | null = null

/**
 * Generate a unique key for a quote
 */
function makeQuoteKey(portalSlug: string, quoteNumber: string): string {
  return `${portalSlug}:${quoteNumber}`
}

/**
 * Initialize or refresh the registry from discovery
 */
export function refreshRegistry(): RegistryState {
  const { clients, errors } = discoverQuotes()
  
  if (errors.length > 0) {
    console.warn('Discovery errors:', errors)
  }
  
  const quotesMap = new Map<string, QuoteRegistryEntry>()
  const clientsMap = new Map<string, ClientManifest>()
  
  for (const client of clients) {
    clientsMap.set(client.portalSlug, client.manifest)
    
    for (const quote of client.quotes) {
      const key = makeQuoteKey(client.portalSlug, quote.quoteNumber)
      quotesMap.set(key, quote)
    }
  }
  
  registry = {
    quotes: quotesMap,
    clients: clientsMap,
    lastUpdated: new Date(),
  }
  
  return registry
}

/**
 * Get the current registry (initializes if needed)
 */
export function getRegistry(): RegistryState {
  if (!registry) {
    return refreshRegistry()
  }
  return registry
}

/**
 * Get quote info by portal slug and quote number
 */
export function getQuoteRoute(
  portalSlug: string,
  quoteNumber: string
): QuoteRouteInfo | null {
  const reg = getRegistry()
  const key = makeQuoteKey(portalSlug, quoteNumber)
  const entry = reg.quotes.get(key)
  
  if (!entry) return null
  
  return {
    portalSlug: entry.portalSlug,
    quoteNumber: entry.quoteNumber,
    version: entry.version,
    routePath: entry.routePath,
    hasCustomPage: Boolean(entry.pagePath),
    contentHash: entry.contentHash,
  }
}

/**
 * Get quote entry by portal slug and quote number
 */
export function getQuoteEntry(
  portalSlug: string,
  quoteNumber: string
): QuoteRegistryEntry | null {
  const reg = getRegistry()
  const key = makeQuoteKey(portalSlug, quoteNumber)
  return reg.quotes.get(key) || null
}

/**
 * Get all quotes for a portal slug
 */
export function getQuotesForClient(portalSlug: string): QuoteRegistryEntry[] {
  const reg = getRegistry()
  const quotes: QuoteRegistryEntry[] = []
  
  reg.quotes.forEach((entry, key) => {
    if (key.startsWith(`${portalSlug}:`)) {
      quotes.push(entry)
    }
  })
  
  return quotes
}

/**
 * Get client info from registry
 */
export function getClientInfo(portalSlug: string): ClientManifest | null {
  const reg = getRegistry()
  return reg.clients.get(portalSlug) || null
}

/**
 * Get all registered routes for static generation
 */
export function getAllQuoteRoutes(): QuoteRouteInfo[] {
  const reg = getRegistry()
  const routes: QuoteRouteInfo[] = []
  
  reg.quotes.forEach((entry) => {
    routes.push({
      portalSlug: entry.portalSlug,
      quoteNumber: entry.quoteNumber,
      version: entry.version,
      routePath: entry.routePath,
      hasCustomPage: Boolean(entry.pagePath),
      contentHash: entry.contentHash,
    })
  })
  
  return routes
}

/**
 * Check if registry is stale (older than threshold)
 */
export function isRegistryStale(maxAgeMs: number = 60000): boolean {
  if (!registry) return true
  return Date.now() - registry.lastUpdated.getTime() > maxAgeMs
}
