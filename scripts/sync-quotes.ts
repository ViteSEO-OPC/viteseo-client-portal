#!/usr/bin/env npx ts-node
/**
 * Quote Sync Script
 * 
 * Syncs quotes from the clients/ directory to the database.
 * Run manually or as part of CI/deploy pipeline.
 * 
 * Usage:
 *   npm run sync:quotes
 *   npx ts-node scripts/sync-quotes.ts
 *   npx ts-node scripts/sync-quotes.ts --dry-run
 */

import { PrismaClient, QuoteStatus } from '@prisma/client'
import { discoverQuotes, calculateQuoteContentHash } from '../lib/quotes/discovery'
import type { ClientRegistryEntry, QuoteRegistryEntry } from '../lib/quotes/types'
import { encrypt } from '../lib/auth/encryption'

const prisma = new PrismaClient()

interface SyncResult {
  clientsCreated: number
  clientsUpdated: number
  quotesCreated: number
  quotesUpdated: number
  quotesVersioned: number
  errors: Array<{ entity: string; error: string }>
}

const isDryRun = process.argv.includes('--dry-run')

async function syncClient(client: ClientRegistryEntry): Promise<{
  clientId: string
  isNew: boolean
  error?: string
}> {
  try {
    // Check if client exists by portal slug
    const existing = await prisma.client.findUnique({
      where: { portalSlug: client.portalSlug },
    })

    // Encrypt PII fields
    const encryptedEmail = encrypt(client.manifest.email)

    const clientData = {
      companyName: client.manifest.companyName,
      contactName: client.manifest.contactName,
      email: encryptedEmail,
      timezone: client.manifest.timezone || 'Asia/Manila',
      status: (client.manifest.status as 'active' | 'inactive' | 'archived') || 'active',
    }

    if (existing) {
      if (!isDryRun) {
        await prisma.client.update({
          where: { id: existing.id },
          data: clientData,
        })
      }
      console.log(`  Updated client: ${client.portalSlug}`)
      return { clientId: existing.id, isNew: false }
    } else {
      if (!isDryRun) {
        const newClient = await prisma.client.create({
          data: {
            ...clientData,
            portalSlug: client.portalSlug,
          },
        })
        console.log(`  Created client: ${client.portalSlug}`)
        return { clientId: newClient.id, isNew: true }
      } else {
        console.log(`  [DRY RUN] Would create client: ${client.portalSlug}`)
        return { clientId: 'dry-run-id', isNew: true }
      }
    }
  } catch (error) {
    console.error(`  Error syncing client ${client.portalSlug}:`, error)
    return { clientId: '', isNew: false, error: String(error) }
  }
}

async function syncQuote(
  quote: QuoteRegistryEntry,
  clientId: string
): Promise<{
  quoteId: string
  action: 'created' | 'updated' | 'versioned' | 'unchanged'
  error?: string
}> {
  try {
    // Check if quote exists
    const existing = await prisma.quote.findFirst({
      where: {
        clientId,
        quoteNumber: quote.quoteNumber,
      },
      orderBy: { version: 'desc' },
    })

    const quoteData = {
      quoteNumber: quote.quoteNumber,
      version: quote.version,
      validUntil: new Date(quote.manifest.validUntil),
      total: parseFloat(quote.manifest.total),
      currency: quote.manifest.currency,
      notes: quote.manifest.notes,
      contentHash: quote.contentHash,
      routePath: quote.routePath,
    }

    if (existing) {
      // Check if content has changed
      if (existing.contentHash === quote.contentHash) {
        console.log(`    Unchanged quote: ${quote.quoteNumber}`)
        return { quoteId: existing.id, action: 'unchanged' }
      }

      // Check if quote is immutable (sent or later)
      const immutableStatuses: QuoteStatus[] = ['sent', 'viewed', 'accepted', 'rejected', 'expired']
      
      if (immutableStatuses.includes(existing.status)) {
        // Create new version
        if (!isDryRun) {
          // Mark old quote as superseded
          await prisma.quote.update({
            where: { id: existing.id },
            data: { status: 'superseded' },
          })

          // Create new version
          const newQuote = await prisma.quote.create({
            data: {
              clientId,
              ...quoteData,
              version: existing.version + 1,
              previousQuoteId: existing.id,
              status: 'draft',
            },
          })

          // Sync quote items
          await syncQuoteItems(newQuote.id, quote)

          console.log(`    Versioned quote: ${quote.quoteNumber} v${existing.version + 1}`)
          return { quoteId: newQuote.id, action: 'versioned' }
        } else {
          console.log(`    [DRY RUN] Would version quote: ${quote.quoteNumber}`)
          return { quoteId: '', action: 'versioned' }
        }
      } else {
        // Update existing draft quote
        if (!isDryRun) {
          await prisma.quote.update({
            where: { id: existing.id },
            data: quoteData,
          })

          // Sync quote items
          await syncQuoteItems(existing.id, quote)

          console.log(`    Updated quote: ${quote.quoteNumber}`)
          return { quoteId: existing.id, action: 'updated' }
        } else {
          console.log(`    [DRY RUN] Would update quote: ${quote.quoteNumber}`)
          return { quoteId: '', action: 'updated' }
        }
      }
    } else {
      // Create new quote
      if (!isDryRun) {
        const newQuote = await prisma.quote.create({
          data: {
            clientId,
            ...quoteData,
            status: 'draft',
          },
        })

        // Sync quote items
        await syncQuoteItems(newQuote.id, quote)

        console.log(`    Created quote: ${quote.quoteNumber}`)
        return { quoteId: newQuote.id, action: 'created' }
      } else {
        console.log(`    [DRY RUN] Would create quote: ${quote.quoteNumber}`)
        return { quoteId: '', action: 'created' }
      }
    }
  } catch (error) {
    console.error(`    Error syncing quote ${quote.quoteNumber}:`, error)
    return { quoteId: '', action: 'unchanged', error: String(error) }
  }
}

async function syncQuoteItems(quoteId: string, quote: QuoteRegistryEntry): Promise<void> {
  // Delete existing items
  await prisma.quoteItem.deleteMany({
    where: { quoteId },
  })

  // Create new items
  await prisma.quoteItem.createMany({
    data: quote.manifest.items.map((item, index) => ({
      quoteId,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      sortOrder: item.sortOrder ?? index,
    })),
  })
}

async function main(): Promise<void> {
  console.log('🔄 Starting quote sync...')
  if (isDryRun) {
    console.log('📋 DRY RUN MODE - No changes will be made')
  }
  console.log('')

  const result: SyncResult = {
    clientsCreated: 0,
    clientsUpdated: 0,
    quotesCreated: 0,
    quotesUpdated: 0,
    quotesVersioned: 0,
    errors: [],
  }

  // Discover quotes from file system
  const { clients, errors: discoveryErrors } = discoverQuotes()

  if (discoveryErrors.length > 0) {
    console.warn('⚠️  Discovery warnings:')
    for (const err of discoveryErrors) {
      console.warn(`   ${err.path}: ${err.error}`)
    }
    console.log('')
  }

  console.log(`📁 Found ${clients.length} clients with ${clients.reduce((sum, c) => sum + c.quotes.length, 0)} quotes`)
  console.log('')

  // Sync each client and their quotes
  for (const client of clients) {
    console.log(`📦 Processing client: ${client.portalSlug}`)

    const { clientId, isNew, error: clientError } = await syncClient(client)

    if (clientError) {
      result.errors.push({ entity: `client:${client.portalSlug}`, error: clientError })
      continue
    }

    if (isNew) {
      result.clientsCreated++
    } else {
      result.clientsUpdated++
    }

    // Sync quotes for this client
    for (const quote of client.quotes) {
      const { action, error: quoteError } = await syncQuote(quote, clientId)

      if (quoteError) {
        result.errors.push({ entity: `quote:${quote.quoteNumber}`, error: quoteError })
        continue
      }

      switch (action) {
        case 'created':
          result.quotesCreated++
          break
        case 'updated':
          result.quotesUpdated++
          break
        case 'versioned':
          result.quotesVersioned++
          break
      }
    }

    console.log('')
  }

  // Summary
  console.log('📊 Sync Summary:')
  console.log(`   Clients: ${result.clientsCreated} created, ${result.clientsUpdated} updated`)
  console.log(`   Quotes: ${result.quotesCreated} created, ${result.quotesUpdated} updated, ${result.quotesVersioned} versioned`)

  if (result.errors.length > 0) {
    console.log('')
    console.log('❌ Errors:')
    for (const err of result.errors) {
      console.log(`   ${err.entity}: ${err.error}`)
    }
    process.exit(1)
  }

  console.log('')
  console.log('✅ Sync completed successfully!')
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
