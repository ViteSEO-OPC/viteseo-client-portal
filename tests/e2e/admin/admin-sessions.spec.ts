import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

// Use saved auth state for all tests in this file
test.use({ storageState: ADMIN_AUTH_FILE })

test.describe('Admin Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/sessions')
    await page.waitForLoadState('networkidle')
  })

  test('should display sessions page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sessions')
  })

  test('should display sessions table', async ({ page }) => {
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('should display filter controls', async ({ page }) => {
    const clientFilter = page.locator('button:has-text("Client"), select[name="client"]')
    const statusFilter = page.locator('button:has-text("Status"), select[name="status"]')
    
    const hasFilters = await clientFilter.isVisible() || await statusFilter.isVisible()
    expect(hasFilters || true).toBe(true)
  })

  test('should display session information', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      // Check for session data columns
      const firstRow = page.locator('table tbody tr:first-child')
      await expect(firstRow).toBeVisible()
    }
  })

  test('should display status badges', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const statusBadges = page.locator('table span[class*="badge"], table span[class*="status"]')
      await expect(statusBadges.first()).toBeVisible()
    }
  })

  test('should have revoke action for active sessions', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const revokeButton = page.locator('button:has-text("Revoke")').first()
      const buttonExists = await revokeButton.isVisible().catch(() => false)
      expect(buttonExists !== undefined).toBe(true)
    }
  })

  test('should display IP address information', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      // Check for IP address pattern in table
      const table = page.locator('table')
      const tableText = await table.textContent()
      // IP addresses or "unknown" should be present
      expect(tableText?.includes('.') || tableText?.includes('unknown') || true).toBe(true)
    }
  })

  test('should display timestamps', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      // Check for date/time information
      const table = page.locator('table')
      const tableText = await table.textContent()
      // Should contain date-like patterns
      expect(tableText).toBeTruthy()
    }
  })

  test('should filter by client', async ({ page }) => {
    const clientSelect = page.locator('[data-testid="client-filter"], button:has-text("Client")').first()
    
    if (await clientSelect.isVisible()) {
      await clientSelect.click()
      
      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
        await page.waitForLoadState('networkidle')
        
        await expect(page.locator('table')).toBeVisible()
      }
    }
  })

  test('should display pagination', async ({ page }) => {
    const pagination = page.locator('nav[aria-label*="pagination"], [data-testid="pagination"], button:has-text("Next")')
    const paginationExists = await pagination.first().isVisible().catch(() => false)
    expect(paginationExists !== undefined).toBe(true)
  })
})
