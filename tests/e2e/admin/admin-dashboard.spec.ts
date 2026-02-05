import { test, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

// Use saved auth state for all tests in this file
test.use({ storageState: ADMIN_AUTH_FILE })

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
  })

  test('should display dashboard page', async ({ page }) => {
    // Dashboard should load
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
  })

  test('should display stats cards', async ({ page }) => {
    // Check for stats cards (Clients, Quotes, Activity)
    const statsCards = page.locator('[data-testid="stat-card"], .bg-card')
    await expect(statsCards.first()).toBeVisible()
  })

  test('should display navigation links', async ({ page }) => {
    // Check for main navigation links
    await expect(page.locator('a[href="/admin/clients"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/quotes"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/access-codes"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/sessions"]')).toBeVisible()
    await expect(page.locator('a[href="/admin/audit-logs"]')).toBeVisible()
  })

  test('should display recent quotes section', async ({ page }) => {
    // Check for recent quotes table or card
    const recentQuotes = page.locator('text=Recent Quotes')
    await expect(recentQuotes).toBeVisible()
  })

  test('should navigate to clients page', async ({ page }) => {
    await page.click('a[href="/admin/clients"]')
    await expect(page).toHaveURL('/admin/clients')
    await expect(page.locator('h1')).toContainText('Clients')
  })

  test('should navigate to quotes page', async ({ page }) => {
    await page.click('a[href="/admin/quotes"]')
    await expect(page).toHaveURL('/admin/quotes')
    await expect(page.locator('h1')).toContainText('Quotes')
  })

  test('should navigate to access codes page', async ({ page }) => {
    await page.click('a[href="/admin/access-codes"]')
    await expect(page).toHaveURL('/admin/access-codes')
    await expect(page.locator('h1')).toContainText('Access Codes')
  })

  test('should navigate to sessions page', async ({ page }) => {
    await page.click('a[href="/admin/sessions"]')
    await expect(page).toHaveURL('/admin/sessions')
    await expect(page.locator('h1')).toContainText('Sessions')
  })

  test('should navigate to audit logs page', async ({ page }) => {
    await page.click('a[href="/admin/audit-logs"]')
    await expect(page).toHaveURL('/admin/audit-logs')
    await expect(page.locator('h1')).toContainText('Audit Logs')
  })
})
