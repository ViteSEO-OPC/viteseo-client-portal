/**
 * Quote discovery module
 * Scans clients/ directory for quote manifests and pages
 */

import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import type {
  QuoteManifest,
  ClientManifest,
  QuoteRegistryEntry,
  ClientRegistryEntry,
  DiscoveryResult,
} from './types'

const CLIENTS_DIR = path.join(process.cwd(), 'clients')
const CLIENT_MANIFEST_FILE = 'client.manifest.json'
const QUOTE_MANIFEST_FILE = 'quote.manifest.json'
const LEGACY_DATA_FILE = 'data.json'

/**
 * Calculate content hash from manifest + page file
 */
export function calculateQuoteContentHash(
  manifest: QuoteManifest,
  pageContent?: string
): string {
  const hashContent = JSON.stringify({
    manifest,
    pageContent: pageContent || '',
  })
  return createHash('sha256').update(hashContent).digest('hex')
}

/**
 * Parse a quote manifest file
 */
function parseQuoteManifest(filePath: string): QuoteManifest | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    
    // Validate required fields
    if (!parsed.quoteNumber || !parsed.validUntil || !parsed.total || !parsed.items) {
      console.warn(`Invalid quote manifest at ${filePath}: missing required fields`)
      return null
    }
    
    return {
      quoteNumber: parsed.quoteNumber,
      version: parsed.version || 1,
      validUntil: parsed.validUntil,
      total: String(parsed.total),
      currency: parsed.currency || 'PHP',
      notes: parsed.notes,
      items: parsed.items.map((item: Record<string, unknown>, index: number) => ({
        id: String(item.id || index + 1),
        name: String(item.name),
        description: item.description ? String(item.description) : undefined,
        quantity: Number(item.quantity) || 1,
        unitPrice: String(item.unitPrice),
        sortOrder: Number(item.sortOrder) || index,
      })),
    }
  } catch (error) {
    console.error(`Failed to parse quote manifest at ${filePath}:`, error)
    return null
  }
}

/**
 * Parse a client manifest file (or legacy data.json)
 */
function parseClientManifest(filePath: string): ClientManifest | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(content)
    
    // Support both new format and legacy data.json
    return {
      companyName: parsed.companyName || parsed.clientName,
      contactName: parsed.contactName,
      email: parsed.email,
      timezone: parsed.timezone || 'Asia/Manila',
      status: parsed.status || 'active',
    }
  } catch (error) {
    console.error(`Failed to parse client manifest at ${filePath}:`, error)
    return null
  }
}

/**
 * Discover all quotes for a single client
 */
function discoverClientQuotes(
  clientDir: string,
  portalSlug: string,
  errors: Array<{ path: string; error: string }>
): QuoteRegistryEntry[] {
  const quotes: QuoteRegistryEntry[] = []
  const quotesDir = path.join(clientDir, 'quotes')
  
  // Check if quotes directory exists
  if (!fs.existsSync(quotesDir) || !fs.statSync(quotesDir).isDirectory()) {
    // Try to create a quote from legacy data.json
    const legacyFile = path.join(clientDir, LEGACY_DATA_FILE)
    if (fs.existsSync(legacyFile)) {
      const legacyData = parseClientManifest(legacyFile)
      if (legacyData) {
        try {
          const content = fs.readFileSync(legacyFile, 'utf-8')
          const parsed = JSON.parse(content)
          
          if (parsed.quoteNumber && parsed.items) {
            const manifest: QuoteManifest = {
              quoteNumber: parsed.quoteNumber,
              version: parsed.version || 1,
              validUntil: parsed.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              total: String(parsed.total || '0'),
              currency: parsed.currency || 'PHP',
              notes: parsed.notes,
              items: parsed.items.map((item: Record<string, unknown>, index: number) => ({
                id: String(item.id || index + 1),
                name: String(item.name),
                description: item.description ? String(item.description) : undefined,
                quantity: Number(item.quantity) || 1,
                unitPrice: String(item.unitPrice),
                sortOrder: index,
              })),
            }
            
            const contentHash = calculateQuoteContentHash(manifest)
            
            quotes.push({
              portalSlug,
              quoteNumber: manifest.quoteNumber,
              version: manifest.version,
              manifest,
              routePath: `/portal/${portalSlug}`,
              pagePath: '', // No custom page, uses default
              contentHash,
            })
          }
        } catch (e) {
          errors.push({ path: legacyFile, error: String(e) })
        }
      }
    }
    return quotes
  }
  
  // Scan quotes directory
  const quoteNumberDirs = fs.readdirSync(quotesDir).filter(name => {
    const fullPath = path.join(quotesDir, name)
    return fs.statSync(fullPath).isDirectory()
  })
  
  for (const quoteNumber of quoteNumberDirs) {
    const quoteDir = path.join(quotesDir, quoteNumber)
    const manifestPath = path.join(quoteDir, QUOTE_MANIFEST_FILE)
    const pagePath = path.join(quoteDir, 'page.tsx')
    
    // Manifest is required
    if (!fs.existsSync(manifestPath)) {
      errors.push({ path: quoteDir, error: 'Missing quote.manifest.json' })
      continue
    }
    
    const manifest = parseQuoteManifest(manifestPath)
    if (!manifest) {
      errors.push({ path: manifestPath, error: 'Failed to parse manifest' })
      continue
    }
    
    // Page is optional - if exists, read it for content hash
    let pageContent: string | undefined
    const hasCustomPage = fs.existsSync(pagePath)
    if (hasCustomPage) {
      pageContent = fs.readFileSync(pagePath, 'utf-8')
    }
    
    const contentHash = calculateQuoteContentHash(manifest, pageContent)
    const routePath = `/portal/quotes/${portalSlug}/${quoteNumber}`
    
    quotes.push({
      portalSlug,
      quoteNumber: manifest.quoteNumber,
      version: manifest.version,
      manifest,
      routePath,
      pagePath: hasCustomPage ? pagePath : '',
      contentHash,
    })
  }
  
  return quotes
}

/**
 * Discover all clients and their quotes from the clients/ directory
 */
export function discoverQuotes(): DiscoveryResult {
  const clients: ClientRegistryEntry[] = []
  const errors: Array<{ path: string; error: string }> = []
  
  // Check if clients directory exists
  if (!fs.existsSync(CLIENTS_DIR)) {
    return { clients, errors: [{ path: CLIENTS_DIR, error: 'clients/ directory not found' }] }
  }
  
  // Get all client directories
  const clientSlugs = fs.readdirSync(CLIENTS_DIR).filter(name => {
    if (name === 'README.md') return false
    const fullPath = path.join(CLIENTS_DIR, name)
    return fs.statSync(fullPath).isDirectory()
  })
  
  for (const portalSlug of clientSlugs) {
    const clientDir = path.join(CLIENTS_DIR, portalSlug)
    
    // Look for client manifest (or legacy data.json)
    let clientManifest: ClientManifest | null = null
    const newManifestPath = path.join(clientDir, CLIENT_MANIFEST_FILE)
    const legacyManifestPath = path.join(clientDir, LEGACY_DATA_FILE)
    
    if (fs.existsSync(newManifestPath)) {
      clientManifest = parseClientManifest(newManifestPath)
    } else if (fs.existsSync(legacyManifestPath)) {
      clientManifest = parseClientManifest(legacyManifestPath)
    }
    
    if (!clientManifest) {
      errors.push({ path: clientDir, error: 'No valid client manifest found' })
      continue
    }
    
    // Discover quotes for this client
    const quotes = discoverClientQuotes(clientDir, portalSlug, errors)
    
    clients.push({
      portalSlug,
      manifest: clientManifest,
      quotes,
    })
  }
  
  return { clients, errors }
}

/**
 * Get a specific quote by slug and quote number
 */
export function getQuoteBySlugAndNumber(
  portalSlug: string,
  quoteNumber: string
): QuoteRegistryEntry | null {
  const { clients } = discoverQuotes()
  const client = clients.find(c => c.portalSlug === portalSlug)
  if (!client) return null
  
  return client.quotes.find(q => q.quoteNumber === quoteNumber) || null
}

/**
 * Get all quotes for a client
 */
export function getClientQuotes(portalSlug: string): QuoteRegistryEntry[] {
  const { clients } = discoverQuotes()
  const client = clients.find(c => c.portalSlug === portalSlug)
  return client?.quotes || []
}

/**
 * Get client manifest by slug
 */
export function getClientManifest(portalSlug: string): ClientManifest | null {
  const { clients } = discoverQuotes()
  const client = clients.find(c => c.portalSlug === portalSlug)
  return client?.manifest || null
}
