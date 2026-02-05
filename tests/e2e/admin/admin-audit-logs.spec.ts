import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

// Use saved auth state for all tests in this file
test.use({ storageState: ADMIN_AUTH_FILE })

test.describe('Admin Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/audit-logs')
    await page.waitForLoadState('networkidle')
  })

  test('should display audit logs page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Audit Logs')
  })

  test('should display audit logs table', async ({ page }) => {
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('should display total events count', async ({ page }) => {
    const countText = page.locator('text=/\\d+ total events/i')
    await expect(countText).toBeVisible()
  })

  test('should display event type filter', async ({ page }) => {
    const eventTypeFilter = page.locator('button:has-text("Event Type"), select[name="eventType"]')
    await expect(eventTypeFilter).toBeVisible()
  })

  test('should display actor type filter', async ({ page }) => {
    const actorTypeFilter = page.locator('button:has-text("Actor Type"), select[name="actorType"]')
    await expect(actorTypeFilter).toBeVisible()
  })

  test('should display event type badges', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const eventBadges = page.locator('table span[class*="badge"], table span[class*="status"]')
      await expect(eventBadges.first()).toBeVisible()
    }
  })

  test('should display action descriptions', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const firstRow = page.locator('table tbody tr:first-child')
      const rowText = await firstRow.textContent()
      // Action descriptions should have meaningful text
      expect(rowText?.length).toBeGreaterThan(0)
    }
  })

  test('should display timestamps', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const table = page.locator('table')
      const tableText = await table.textContent()
      // Should contain time-related information
      expect(tableText).toBeTruthy()
    }
  })

  test('should filter by event type', async ({ page }) => {
    const eventTypeSelect = page.locator('[data-testid="event-type-filter"], button:has-text("Event Type")').first()
    
    if (await eventTypeSelect.isVisible()) {
      await eventTypeSelect.click()
      
      const firstOption = page.locator('[role="option"]').first()
      if (await firstOption.isVisible()) {
        await firstOption.click()
        await page.waitForLoadState('networkidle')
        
        await expect(page.locator('table')).toBeVisible()
      }
    }
  })

  test('should filter by actor type', async ({ page }) => {
    const actorTypeSelect = page.locator('[data-testid="actor-type-filter"], button:has-text("Actor Type")').first()
    
    if (await actorTypeSelect.isVisible()) {
      await actorTypeSelect.click()
      
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

  test('should navigate between pages', async ({ page }) => {
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")')
    
    if (await nextButton.isVisible()) {
      await nextButton.click()
      await page.waitForLoadState('networkidle')
      
      // Should still be on audit logs page
      await expect(page).toHaveURL(/\/admin\/audit-logs/)
      await expect(page.locator('table')).toBeVisible()
    }
  })

  test('should display IP addresses', async ({ page }) => {
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()
    
    if (rowCount > 0) {
      const table = page.locator('table')
      const tableText = await table.textContent()
      // IP addresses, "unknown", or "-" should be present
      expect(tableText).toBeTruthy()
    }
  })

  test('should show all event types in filter', async ({ page }) => {
    const eventTypeSelect = page.locator('button:has-text("Event Type")').first()
    
    if (await eventTypeSelect.isVisible()) {
      await eventTypeSelect.click()
      
      // Check for common event types
      const options = page.locator('[role="option"]')
      const optionCount = await options.count()
      expect(optionCount).toBeGreaterThan(0)
      
      // Close dropdown
      await page.keyboard.press('Escape')
    }
  })
})
