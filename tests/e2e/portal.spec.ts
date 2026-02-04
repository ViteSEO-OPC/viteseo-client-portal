import { test, expect } from '@playwright/test'

test.describe('Portal Access', () => {
  test('should return 404 for non-existent portal slug', async ({ page }) => {
    const response = await page.goto('/portal/nonexistent-client-12345')
    expect(response?.status()).toBe(404)
  })

  test('should not expose portal content to unauthenticated users', async ({ request }) => {
    // Direct API call without session
    const response = await request.get('/api/portal/quote')
    expect(response.status()).toBe(401)
    const body = await response.json()
    expect(body.error.code).toBe('SESSION_EXPIRED')
  })
})

test.describe('Quote Actions API', () => {
  test('should reject accept request without CSRF token', async ({ request }) => {
    const response = await request.post('/api/portal/quote/accept', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    // Without session, should return session expired
    expect(response.status()).toBe(401)
  })

  test('should reject reject request without CSRF token', async ({ request }) => {
    const response = await request.post('/api/portal/quote/reject', {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    // Without session, should return session expired
    expect(response.status()).toBe(401)
  })
})

test.describe('PDF Generation', () => {
  test('should reject PDF request without session', async ({ request }) => {
    const response = await request.post('/api/portal/pdf')
    expect(response.status()).toBe(401)
  })

  test('should reject PDF render without token', async ({ request }) => {
    const response = await request.get('/api/portal/pdf/render')
    expect(response.status()).toBe(401)
  })

  test('should reject PDF render with invalid token', async ({ request }) => {
    const response = await request.get('/api/portal/pdf/render?token=invalid-token-12345')
    expect(response.status()).toBe(401)
  })
})

test.describe('PDF Render Page', () => {
  test('should return 404 for render page without token', async ({ page }) => {
    const response = await page.goto('/portal/pdf/render')
    expect(response?.status()).toBe(404)
  })

  test('should return 404 for render page with invalid token', async ({ page }) => {
    const response = await page.goto('/portal/pdf/render?token=invalid-token')
    expect(response?.status()).toBe(404)
  })
})
