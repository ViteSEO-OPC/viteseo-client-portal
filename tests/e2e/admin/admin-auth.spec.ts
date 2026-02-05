import { test, expect } from '@playwright/test'

test.describe('Admin Authentication', () => {
  test('should redirect unauthenticated users to sign-in page', async ({ page }) => {
    // Attempt to access admin dashboard without authentication
    await page.goto('/admin')
    
    // Should be redirected to Clerk sign-in
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should redirect unauthenticated users from admin clients page', async ({ page }) => {
    await page.goto('/admin/clients')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should redirect unauthenticated users from admin quotes page', async ({ page }) => {
    await page.goto('/admin/quotes')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should redirect unauthenticated users from admin access-codes page', async ({ page }) => {
    await page.goto('/admin/access-codes')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should redirect unauthenticated users from admin sessions page', async ({ page }) => {
    await page.goto('/admin/sessions')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should redirect unauthenticated users from admin audit-logs page', async ({ page }) => {
    await page.goto('/admin/audit-logs')
    await expect(page).toHaveURL(/sign-in/)
  })

  test('should display sign-in form on sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')
    
    // Clerk sign-in form should be visible
    await expect(page.locator('.cl-signIn-root')).toBeVisible()
  })
})
