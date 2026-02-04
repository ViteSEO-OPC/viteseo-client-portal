import 'server-only'
import { chromium, type Browser } from 'playwright'
import { prisma } from '@/lib/db'

let browserInstance: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process',
      ],
    })
  }
  return browserInstance
}

export interface PDFGenerationResult {
  success: boolean
  pdfBuffer?: Buffer
  error?: string
}

export async function generateQuotePDF(
  quoteId: string,
  clientId: string,
  renderToken: string,
  baseUrl?: string,
  routePath?: string | null
): Promise<PDFGenerationResult> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    userAgent: 'ViteSEO-PDF-Generator/1.0',
  })

  try {
    const page = await context.newPage()

    const hideSelectors = [
      '.tsqd-parent-container',
      '.ReactQueryDevtools',
      '[aria-label*="Devtools"]',
      '[aria-label*="React Query"]',
      '[data-testid*="devtools"]',
      '#__next-build-watcher',
      '[data-nextjs-dev-overlay]',
      '[class*="nextjs-error"]',
      'nextjs-portal',
      '#nextjs__toast',
      '[data-nextjs-toast]',
      '[class*="nextjs-toast"]',
      '[data-sentry-feedback]',
      '.sentry-error-embed-wrapper',
      '[class*="sentry"]',
    ]

    await page.addInitScript((selectors: string[]) => {
      const selector = selectors.join(',')
      if (!selector) return

      const hideElements = () => {
        document.querySelectorAll(selector).forEach((el) => {
          const node = el as HTMLElement
          node.style.setProperty('display', 'none', 'important')
          node.style.setProperty('visibility', 'hidden', 'important')
          node.setAttribute('data-pdf-hidden', 'true')
        })
      }

      const startObserver = () => {
        hideElements()
        const observer = new MutationObserver(() => hideElements())
        const root = document.documentElement || document.body || document
        observer.observe(root, { childList: true, subtree: true })
      }

      if (document.documentElement) {
        startObserver()
      } else {
        window.addEventListener('DOMContentLoaded', startObserver)
      }
    }, hideSelectors)

    // Navigate to the dedicated PDF render page (not API route to avoid recursion)
    const resolvedBaseUrl =
      baseUrl ||
      process.env.PDF_RENDER_BASE_URL ||
      process.env.APP_URL ||
      'http://localhost:3000'

    // Always use the PDF render page with token for security
    const renderUrl = `${resolvedBaseUrl}/portal/pdf/render?token=${renderToken}`

    const response = await page.goto(renderUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })

    // Wait for content to fully render
    await page.waitForSelector('[data-pdf-ready="true"]', { timeout: 10000 }).catch(() => {
      // Continue even if selector not found
    })

    // Hide all development overlays before PDF capture
    await page.evaluate((selectors: string[]) => {
      const selector = selectors.join(',')
      if (!selector) return
      document.querySelectorAll(selector).forEach((el) => {
        const node = el as HTMLElement
        node.style.setProperty('display', 'none', 'important')
        node.style.setProperty('visibility', 'hidden', 'important')
        node.setAttribute('data-pdf-hidden', 'true')
      })
    }, hideSelectors)

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 10px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    })

    await context.close()

    return {
      success: true,
      pdfBuffer: Buffer.from(pdfBuffer),
    }
  } catch (error) {
    await context.close()
    console.error('PDF generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getCachedPDF(
  quoteId: string,
  contentHash: string
): Promise<Buffer | null> {
  const cached = await prisma.pdfCache.findUnique({
    where: {
      quoteId_contentHash: {
        quoteId,
        contentHash,
      },
    },
  })

  if (cached && cached.expiresAt > new Date()) {
    return Buffer.from(cached.pdfData)
  }

  return null
}

export async function cachePDF(
  quoteId: string,
  contentHash: string,
  pdfBuffer: Buffer
): Promise<void> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.pdfCache.upsert({
    where: {
      quoteId_contentHash: {
        quoteId,
        contentHash,
      },
    },
    update: {
      pdfData: pdfBuffer,
      fileSize: pdfBuffer.length,
      expiresAt,
    },
    create: {
      quoteId,
      contentHash,
      pdfData: pdfBuffer,
      fileSize: pdfBuffer.length,
      expiresAt,
    },
  })
}

// Cleanup function to close browser on shutdown
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

process.on('beforeExit', closeBrowser)
process.on('SIGINT', closeBrowser)
process.on('SIGTERM', closeBrowser)
