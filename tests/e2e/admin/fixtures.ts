import { test as base, expect, type Page } from '@playwright/test'

/**
 * Admin E2E Test Fixtures
 * 
 * For Clerk authentication in E2E tests, you have several options:
 * 
 * 1. Use Clerk Testing Tokens (recommended for CI):
 *    Set CLERK_TESTING_TOKEN environment variable
 *    See: https://clerk.com/docs/testing/playwright
 * 
 * 2. Use test mode with bypassable emails:
 *    Configure test instances in Clerk dashboard
 * 
 * 3. Use saved authentication state:
 *    Manually authenticate once and save the storage state
 *    Then reuse it in subsequent tests
 * 
 * For local development, option 3 is often the most practical.
 */

// Admin test credentials from environment variables
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || ''
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || ''

// Storage state file path for authenticated sessions
const ADMIN_STORAGE_STATE = 'tests/e2e/.auth/admin.json'

// Extended test with admin authentication fixture
export const test = base.extend<{ adminPage: Page }>({
  // This fixture provides an authenticated admin page
  adminPage: async ({ browser }, use) => {
    // Create a new context with the saved auth state
    try {
      const context = await browser.newContext({
        storageState: ADMIN_STORAGE_STATE,
      })
      const page = await context.newPage()
      await use(page)
      await context.close()
    } catch {
      // If storage state doesn't exist, create a new context without it
      // Tests will need to authenticate manually
      const context = await browser.newContext()
      const page = await context.newPage()
      await use(page)
      await context.close()
    }
  },
})

export { expect }

/**
 * Helper to perform Clerk sign-in
 * Use this in a setup file to create the auth storage state
 */
export async function clerkSignIn(page: Page, email: string, password: string) {
  await page.goto('/sign-in')
  await page.waitForLoadState('networkidle')
  
  // Wait for Clerk form to be visible
  await page.waitForSelector('.cl-signIn-root', { timeout: 10000 })
  
  // Fill in email
  const emailInput = page.locator('input[name="identifier"]')
  await emailInput.fill(email)
  
  // Click continue
  await page.locator('button:has-text("Continue")').click()
  
  // Wait for password field and fill it
  await page.waitForSelector('input[name="password"]', { timeout: 5000 })
  const passwordInput = page.locator('input[name="password"]')
  await passwordInput.fill(password)
  
  // Click sign in
  await page.locator('button:has-text("Continue")').click()
  
  // Wait for redirect to admin
  await page.waitForURL(/\/admin/, { timeout: 10000 })
}

/**
 * Setup script to create admin auth storage state
 * Run this once before running admin tests:
 * npx playwright test tests/e2e/admin/setup.ts --project=chromium
 */
export async function setupAdminAuth() {
  console.log('To set up admin auth, run:')
  console.log('TEST_ADMIN_EMAIL=your@email.com TEST_ADMIN_PASSWORD=yourpassword npx playwright test tests/e2e/admin/auth.setup.ts --project=chromium')
}
