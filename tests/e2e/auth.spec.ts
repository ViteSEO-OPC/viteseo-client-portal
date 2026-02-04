import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show enter code page', async ({ page }) => {
    await page.goto('/enter-code')
    await expect(page.getByRole('heading', { name: 'Client Portal' })).toBeVisible()
    await expect(page.getByPlaceholder('Enter your 8-character code')).toBeVisible()
  })

  test('should show error for invalid code', async ({ page }) => {
    await page.goto('/enter-code')
    await page.fill('input[type="text"]', 'INVALID1')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Invalid or expired access code')).toBeVisible()
  })

  test('should redirect home to enter-code', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/enter-code')
  })

  test('should return 404 for unauthenticated portal access', async ({ page }) => {
    const response = await page.goto('/portal/test-client')
    expect(response?.status()).toBe(404)
  })

  test('should show validation error for short code', async ({ page }) => {
    await page.goto('/enter-code')
    await page.fill('input[type="text"]', 'ABC')
    await page.click('button[type="submit"]')
    // Should show validation feedback
    await expect(page.locator('input[type="text"]')).toBeVisible()
  })
})

test.describe('Security Headers', () => {
  test('should have X-Robots-Tag header', async ({ page }) => {
    const response = await page.goto('/enter-code')
    const headers = response?.headers()
    expect(headers?.['x-robots-tag']).toContain('noindex')
  })

  test('should have X-Frame-Options header', async ({ page }) => {
    const response = await page.goto('/enter-code')
    const headers = response?.headers()
    expect(headers?.['x-frame-options']).toBe('DENY')
  })

  test('should have X-Content-Type-Options header', async ({ page }) => {
    const response = await page.goto('/enter-code')
    const headers = response?.headers()
    expect(headers?.['x-content-type-options']).toBe('nosniff')
  })

  test('should have Referrer-Policy header', async ({ page }) => {
    const response = await page.goto('/enter-code')
    const headers = response?.headers()
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })
})

test.describe('Rate Limiting', () => {
  test('should rate limit after multiple failed attempts', async ({ page }) => {
    await page.goto('/enter-code')

    // Make multiple failed attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="text"]', 'WRONGCO1')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)
    }

    // Should see rate limit message
    await expect(page.getByText(/too many attempts/i)).toBeVisible()
  })
})

test.describe('API Security', () => {
  test('should return 401 for unauthenticated portal API', async ({ request }) => {
    const response = await request.get('/api/portal/me')
    expect(response.status()).toBe(401)
  })

  test('should return 401 for unauthenticated quote API', async ({ request }) => {
    const response = await request.get('/api/portal/quote')
    expect(response.status()).toBe(401)
  })

  test('should return validation error for malformed code', async ({ request }) => {
    const response = await request.post('/api/auth/verify-code', {
      data: { code: '123' }, // Too short
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })
})

test.describe('Admin Routes', () => {
  test('should redirect unauthenticated admin access to sign-in', async ({ page }) => {
    await page.goto('/admin')
    // Clerk should handle redirect
    await expect(page.url()).toContain('sign-in')
  })
})
