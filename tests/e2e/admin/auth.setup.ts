import { test as setup, expect } from '@playwright/test'
import path from 'path'

const ADMIN_AUTH_FILE = path.join(__dirname, '../.auth/admin.json')

/**
 * Authentication setup for admin E2E tests
 * 
 * This script authenticates with Clerk and saves the session state
 * to a file that can be reused by other tests.
 * 
 * Usage:
 * TEST_ADMIN_EMAIL=your@email.com TEST_ADMIN_PASSWORD=yourpassword \
 *   npx playwright test tests/e2e/admin/auth.setup.ts --project=chromium
 */
setup('authenticate as admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Missing TEST_ADMIN_EMAIL or TEST_ADMIN_PASSWORD environment variables.\n' +
      'Please set them before running auth setup:\n' +
      'TEST_ADMIN_EMAIL=your@email.com TEST_ADMIN_PASSWORD=yourpassword npx playwright test tests/e2e/admin/auth.setup.ts --project=chromium'
    )
  }

  // Navigate to sign-in page
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')

  // Wait for Clerk form to load
  await page.waitForSelector('.cl-signIn-root', { timeout: 15000 })

  // Fill in email
  const emailInput = page.locator('input[name="identifier"]')
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(email)

  // Click continue
  await page.locator('button:has-text("Continue")').click()

  // Wait for password field
  await page.waitForSelector('input[name="password"]', { timeout: 10000 })
  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.fill(password)

  // Click sign in button
  await page.locator('button:has-text("Continue")').click()

  // Wait for successful redirect to admin dashboard
  await page.waitForURL(/\/admin/, { timeout: 15000 })
  
  // Verify we're on the admin page
  await expect(page.locator('h1')).toContainText(/Dashboard|Admin/, { timeout: 10000 })

  // Save authentication state
  await page.context().storageState({ path: ADMIN_AUTH_FILE })
  
  console.log(`Admin auth state saved to: ${ADMIN_AUTH_FILE}`)
})
