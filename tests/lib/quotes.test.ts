import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  calculateQuoteContentHash,
  discoverQuotes,
  getClientManifest,
  getClientQuotes,
} from '@/lib/quotes/discovery'

// Mock the fs module
vi.mock('fs')

const mockClients = {
  'sample-client': {
    'client.manifest.json': JSON.stringify({
      companyName: 'Sample Corp',
      contactName: 'John Doe',
      email: 'john@sample.com',
      timezone: 'Asia/Manila',
    }),
    quotes: {
      'Q-2024-0001': {
        'quote.manifest.json': JSON.stringify({
          quoteNumber: 'Q-2024-0001',
          version: 1,
          validUntil: '2024-12-31T23:59:59Z',
          total: '150000',
          currency: 'PHP',
          items: [
            {
              id: '1',
              name: 'SEO Audit',
              description: 'Comprehensive SEO audit',
              quantity: 1,
              unitPrice: '50000',
            },
          ],
        }),
      },
    },
  },
  'legacy-client': {
    'data.json': JSON.stringify({
      clientName: 'Legacy Corp',
      contactName: 'Jane Smith',
      email: 'jane@legacy.com',
      quoteNumber: 'Q-LEGACY-001',
      validUntil: '2024-12-31T23:59:59Z',
      total: '100000',
      items: [
        {
          id: '1',
          name: 'Basic Package',
          quantity: 1,
          unitPrice: '100000',
        },
      ],
    }),
  },
}

describe('Quote Discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock fs.existsSync
    vi.mocked(fs.existsSync).mockImplementation((filePath: fs.PathLike) => {
      const pathStr = filePath.toString()
      
      // Check if clients directory exists
      if (pathStr.endsWith('/clients')) return true
      
      // Check specific files/directories
      if (pathStr.includes('sample-client')) {
        if (pathStr.endsWith('sample-client')) return true
        if (pathStr.includes('client.manifest.json')) return true
        if (pathStr.includes('quotes')) return true
        if (pathStr.includes('Q-2024-0001')) return true
        if (pathStr.includes('quote.manifest.json')) return true
        if (pathStr.includes('page.tsx')) return true
      }
      
      if (pathStr.includes('legacy-client')) {
        if (pathStr.endsWith('legacy-client')) return true
        if (pathStr.includes('data.json')) return true
      }
      
      return false
    })
    
    // Mock fs.readdirSync
    vi.mocked(fs.readdirSync).mockImplementation(((dirPath: fs.PathLike) => {
      const pathStr = dirPath.toString()
      
      if (pathStr.endsWith('/clients')) {
        return ['sample-client', 'legacy-client', 'README.md']
      }
      
      if (pathStr.includes('sample-client/quotes')) {
        return ['Q-2024-0001']
      }
      
      return []
    }) as typeof fs.readdirSync)
    
    // Mock fs.statSync
    vi.mocked(fs.statSync).mockImplementation((filePath: fs.PathLike) => {
      const pathStr = filePath.toString()
      
      // Directories
      if (
        pathStr.endsWith('sample-client') ||
        pathStr.endsWith('legacy-client') ||
        pathStr.includes('/quotes') ||
        pathStr.includes('Q-2024-0001')
      ) {
        return { isDirectory: () => true } as fs.Stats
      }
      
      return { isDirectory: () => false } as fs.Stats
    })
    
    // Mock fs.readFileSync
    vi.mocked(fs.readFileSync).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      const pathStr = filePath.toString()
      
      if (pathStr.includes('sample-client/client.manifest.json')) {
        return mockClients['sample-client']['client.manifest.json']
      }
      
      if (pathStr.includes('sample-client/quotes/Q-2024-0001/quote.manifest.json')) {
        return mockClients['sample-client'].quotes['Q-2024-0001']['quote.manifest.json']
      }
      
      if (pathStr.includes('sample-client/quotes/Q-2024-0001/page.tsx')) {
        // Custom page content (optional)
        return 'export default function QuotePage() { return <div>Custom Quote</div> }'
      }
      
      if (pathStr.includes('legacy-client/data.json')) {
        return mockClients['legacy-client']['data.json']
      }
      
      throw new Error(`File not found: ${pathStr}`)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('calculateQuoteContentHash', () => {
    it('should generate consistent hash for same content', () => {
      const manifest = {
        quoteNumber: 'Q-001',
        version: 1,
        validUntil: '2024-12-31',
        total: '1000',
        currency: 'PHP',
        items: [],
      }

      const hash1 = calculateQuoteContentHash(manifest)
      const hash2 = calculateQuoteContentHash(manifest)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex length
    })

    it('should generate different hash for different content', () => {
      const manifest1 = {
        quoteNumber: 'Q-001',
        version: 1,
        validUntil: '2024-12-31',
        total: '1000',
        currency: 'PHP',
        items: [],
      }

      const manifest2 = {
        ...manifest1,
        total: '2000',
      }

      const hash1 = calculateQuoteContentHash(manifest1)
      const hash2 = calculateQuoteContentHash(manifest2)

      expect(hash1).not.toBe(hash2)
    })

    it('should include page content in hash', () => {
      const manifest = {
        quoteNumber: 'Q-001',
        version: 1,
        validUntil: '2024-12-31',
        total: '1000',
        currency: 'PHP',
        items: [],
      }

      const hash1 = calculateQuoteContentHash(manifest)
      const hash2 = calculateQuoteContentHash(manifest, 'custom page content')

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('discoverQuotes', () => {
    it('should discover clients with new manifest format', () => {
      const result = discoverQuotes()

      const sampleClient = result.clients.find(c => c.portalSlug === 'sample-client')
      expect(sampleClient).toBeDefined()
      expect(sampleClient?.manifest.companyName).toBe('Sample Corp')
    })

    it('should discover clients with legacy data.json format', () => {
      const result = discoverQuotes()

      const legacyClient = result.clients.find(c => c.portalSlug === 'legacy-client')
      expect(legacyClient).toBeDefined()
      expect(legacyClient?.manifest.companyName).toBe('Legacy Corp')
    })

    it('should discover quotes from quotes directory', () => {
      const result = discoverQuotes()

      const sampleClient = result.clients.find(c => c.portalSlug === 'sample-client')
      expect(sampleClient?.quotes).toHaveLength(1)
      expect(sampleClient?.quotes[0].quoteNumber).toBe('Q-2024-0001')
    })

    it('should discover quotes from legacy data.json', () => {
      const result = discoverQuotes()

      const legacyClient = result.clients.find(c => c.portalSlug === 'legacy-client')
      expect(legacyClient?.quotes).toHaveLength(1)
      expect(legacyClient?.quotes[0].quoteNumber).toBe('Q-LEGACY-001')
    })

    it('should generate correct route paths', () => {
      const result = discoverQuotes()

      const sampleClient = result.clients.find(c => c.portalSlug === 'sample-client')
      expect(sampleClient?.quotes[0].routePath).toBe('/portal/quotes/sample-client/Q-2024-0001')
    })

    it('should compute content hash for each quote', () => {
      const result = discoverQuotes()

      const sampleClient = result.clients.find(c => c.portalSlug === 'sample-client')
      expect(sampleClient?.quotes[0].contentHash).toBeDefined()
      expect(sampleClient?.quotes[0].contentHash).toHaveLength(64)
    })
  })
})
