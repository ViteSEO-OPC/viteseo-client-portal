import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

// Use saved auth state for all tests in this file
test.use({ storageState: ADMIN_AUTH_FILE })

test.describe('Admin Quotes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')
  })

  test('should display quotes list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Quotes')
  })

  test('should display quotes table', async ({ page }) => {
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('should display quote status badges', async ({ page }) => {
    // Check for status badges in the table
    const statusBadges = page.locator('table span[class*="badge"], table span[class*="status"]')
    
    // If there are quotes, there should be status badges
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test('should have new quote button', async ({ page }) => {
    const newButton = page.locator('a[href="/admin/quotes/new"], button:has-text("New Quote")')
    await expect(newButton).toBeVisible()
  })

  test('should navigate to new quote page', async ({ page }) => {
    await page.click('a[href="/admin/quotes/new"]')
    await expect(page).toHaveURL('/admin/quotes/new')
    await expect(page.locator('h1')).toContainText('New Quote')
  })

  test('should display new quote form', async ({ page }) => {
    await page.goto('/admin/quotes/new')
    await page.waitForLoadState('networkidle')

    // Check for form fields
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

test.describe('Admin Quote Details', () => {
  test.use({ storageState: ADMIN_AUTH_FILE })

  test('should display quote detail page', async ({ page }) => {
    // First, navigate to quotes list
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')

    // Click on the first quote
    const firstQuoteLink = page.locator('table tbody tr:first-child a').first()
    
    if (await firstQuoteLink.isVisible()) {
      await firstQuoteLink.click()
      await page.waitForLoadState('networkidle')
      
      // Should show quote details
      await expect(page.locator('text=Quote Details')).toBeVisible()
    }
  })

  test('should have preview portal button', async ({ page }) => {
    // Navigate to quotes list
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')

    // Click on the first quote
    const firstQuoteLink = page.locator('table tbody tr:first-child a').first()
    
    if (await firstQuoteLink.isVisible()) {
      await firstQuoteLink.click()
      await page.waitForLoadState('networkidle')
      
      // Check for preview portal button
      const previewButton = page.locator('button:has-text("Preview Portal")')
      await expect(previewButton).toBeVisible()
    }
  })

  test('should generate preview URL when clicking preview portal', async ({ page, context }) => {
    // Navigate to quotes list
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')

    // Click on the first quote
    const firstQuoteLink = page.locator('table tbody tr:first-child a').first()
    
    if (await firstQuoteLink.isVisible()) {
      await firstQuoteLink.click()
      await page.waitForLoadState('networkidle')
      
      // Click preview portal button
      const previewButton = page.locator('button:has-text("Preview Portal")')
      
      if (await previewButton.isVisible()) {
        // Listen for new page (popup)
        const [newPage] = await Promise.all([
          context.waitForEvent('page', { timeout: 10000 }),
          previewButton.click(),
        ])

        // New page should have preview token in URL
        await expect(newPage).toHaveURL(/preview=/)
        
        // Wait for page to load
        await newPage.waitForLoadState('networkidle')
        
        // Should show admin preview mode banner
        await expect(newPage.locator('text=Admin Preview Mode')).toBeVisible()
        
        await newPage.close()
      }
    }
  })

  test('should have send quote button for draft quotes', async ({ page }) => {
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')

    // Look for draft quotes
    const draftBadge = page.locator('table tbody tr').filter({ hasText: 'draft' }).first()
    
    if (await draftBadge.isVisible()) {
      await draftBadge.locator('a').first().click()
      await page.waitForLoadState('networkidle')
      
      // Check for send quote button
      const sendButton = page.locator('button:has-text("Send Quote")')
      await expect(sendButton).toBeVisible()
    }
  })

  test('should have generate access code button', async ({ page }) => {
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')

    const firstQuoteLink = page.locator('table tbody tr:first-child a').first()
    
    if (await firstQuoteLink.isVisible()) {
      await firstQuoteLink.click()
      await page.waitForLoadState('networkidle')
      
      // Check for generate access code button
      const accessCodeButton = page.locator('button:has-text("Generate Access Code")')
      await expect(accessCodeButton).toBeVisible()
    }
  })

  test('should display activity timeline', async ({ page }) => {
    await page.goto('/admin/quotes')
    await page.waitForLoadState('networkidle')

    const firstQuoteLink = page.locator('table tbody tr:first-child a').first()
    
    if (await firstQuoteLink.isVisible()) {
      await firstQuoteLink.click()
      await page.waitForLoadState('networkidle')
      
      // Check for activity timeline section
      const timeline = page.locator('text=Activity')
      await expect(timeline).toBeVisible()
    }
  })
})
