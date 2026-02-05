import { test, expect } from '@playwright/test'
import { createHash, randomBytes } from 'crypto'
import { prisma } from '../../lib/db'
import { encrypt } from '../../lib/auth/encryption'

let seeded: {
  clientId: string
  quoteId: string
  quoteNumber: string
} | null = null

function getFutureDate(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function seedQuoteData(uniqueSuffix: string) {
  const portalSlug = `pdf-test-${uniqueSuffix}`
  const quoteNumber = `Q-PDF-${uniqueSuffix}`

  const client = await prisma.client.create({
    data: {
      companyName: `PDF Test Company ${uniqueSuffix}`,
      contactName: 'PDF Tester',
      email: encrypt(`pdf-test-${uniqueSuffix}@example.com`),
      portalSlug,
      timezone: 'UTC',
    },
  })

  const quote = await prisma.quote.create({
    data: {
      clientId: client.id,
      quoteNumber,
      status: 'sent',
      validUntil: getFutureDate(14),
      total: 1500,
      currency: 'USD',
      notes: 'PDF generation test quote.',
    },
  })

  await prisma.quoteItem.createMany({
    data: [
      {
        quoteId: quote.id,
        name: 'Test Line Item',
        description: 'Line item for PDF generation validation.',
        quantity: 3,
        unitPrice: 500,
        sortOrder: 1,
      },
    ],
  })

  seeded = {
    clientId: client.id,
    quoteId: quote.id,
    quoteNumber,
  }
}

async function createPdfToken(): Promise<string> {
  if (!seeded) {
    throw new Error('Quote data not seeded')
  }

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')

  await prisma.pdfRenderToken.create({
    data: {
      quoteId: seeded.quoteId,
      clientId: seeded.clientId,
      tokenHash,
      expiresAt: getFutureDate(1),
    },
  })

  return token
}

async function cleanupSeededData() {
  if (!seeded) {
    return
  }

  await prisma.pdfRenderToken.deleteMany({ where: { quoteId: seeded.quoteId } })
  await prisma.quoteItem.deleteMany({ where: { quoteId: seeded.quoteId } })
  await prisma.quote.delete({ where: { id: seeded.quoteId } })
  await prisma.client.delete({ where: { id: seeded.clientId } })
  seeded = null
}

test.describe('PDF Generation', () => {
  test.beforeAll(async ({}, testInfo) => {
    const suffix = `${testInfo.project.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2, 8)}`
    await seedQuoteData(suffix)
  })

  test.afterAll(async () => {
    await cleanupSeededData()
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  test('renders the PDF preview page on all devices', async ({ page }) => {
    const token = await createPdfToken()

    const response = await page.goto(`/portal/pdf/render?token=${token}`)
    expect(response?.status()).toBe(200)

    await expect(page.locator('[data-pdf-ready="true"]')).toBeVisible()
    await expect(page.locator('.quote-number')).toContainText(seeded?.quoteNumber ?? '')

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 1
    })
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('generates a downloadable PDF', async ({ request }) => {
    const token = await createPdfToken()

    const response = await request.get(`/api/portal/pdf/render?token=${token}`)
    expect(response.status()).toBe(200)

    const contentType = response.headers()['content-type'] || ''
    expect(contentType).toContain('application/pdf')

    const pdfBuffer = await response.body()
    expect(pdfBuffer.length).toBeGreaterThan(1000)
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF')
  })
})
