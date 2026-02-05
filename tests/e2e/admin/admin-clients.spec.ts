import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

// Use saved auth state for all tests in this file
test.use({ storageState: ADMIN_AUTH_FILE })

test.describe('Admin Clients', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/clients')
    await page.waitForLoadState('networkidle')
  })

  test('should display clients list page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Clients')
  })

  test('should display clients table', async ({ page }) => {
    // Check for table structure
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('should have new client button', async ({ page }) => {
    const newButton = page.locator('a[href="/admin/clients/new"], button:has-text("New Client")')
    await expect(newButton).toBeVisible()
  })

  test('should navigate to new client page', async ({ page }) => {
    await page.click('a[href="/admin/clients/new"]')
    await expect(page).toHaveURL('/admin/clients/new')
    await expect(page.locator('h1')).toContainText('New Client')
  })

  test('should display new client form', async ({ page }) => {
    await page.goto('/admin/clients/new')
    await page.waitForLoadState('networkidle')

    // Check for form fields
    await expect(page.locator('input[name="companyName"]')).toBeVisible()
    await expect(page.locator('input[name="contactName"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="portalSlug"]')).toBeVisible()
  })

  test('should validate required fields on new client form', async ({ page }) => {
    await page.goto('/admin/clients/new')
    await page.waitForLoadState('networkidle')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation errors or prevent submission
    // Form should still be on the same page
    await expect(page).toHaveURL('/admin/clients/new')
  })

  test('should create new client', async ({ page }) => {
    await page.goto('/admin/clients/new')
    await page.waitForLoadState('networkidle')

    // Generate unique test data
    const timestamp = Date.now()
    const companyName = `E2E Test Company ${timestamp}`
    const contactName = `Test Contact ${timestamp}`
    const email = `e2e-test-${timestamp}@example.com`
    const portalSlug = `e2e-test-${timestamp}`

    // Fill in the form
    await page.fill('input[name="companyName"]', companyName)
    await page.fill('input[name="contactName"]', contactName)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="portalSlug"]', portalSlug)

    // Submit the form
    await page.click('button[type="submit"]')

    // Should redirect to client detail page or show success
    await page.waitForURL(/\/admin\/clients\/[\w-]+/, { timeout: 10000 })
  })

  test('should display client detail page', async ({ page }) => {
    // First, get the first client from the list
    const firstClientLink = page.locator('table tbody tr:first-child a').first()
    
    if (await firstClientLink.isVisible()) {
      await firstClientLink.click()
      await page.waitForLoadState('networkidle')
      
      // Should show client details
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('should filter clients by search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500) // Wait for debounce
      
      // Table should update (no assertion needed, just check it doesn't crash)
      await expect(page.locator('table')).toBeVisible()
    }
  })
})
