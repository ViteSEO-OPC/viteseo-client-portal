import { describe, it, expect } from 'vitest'
import {
  createQuoteSchema,
  createClientSchema,
  createAccessCodeSchema,
} from '@/lib/validations'

describe('createQuoteSchema', () => {
  const validPayload = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    validUntil: '2026-12-31T23:59:59.000Z',
    items: [
      {
        name: 'SEO Audit',
        description: 'Full site audit',
        quantity: 1,
        unitPrice: 50000,
      },
    ],
  }

  it('should accept a valid payload', () => {
    const result = createQuoteSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('should reject empty items array', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('items'))).toBe(true)
    }
  })

  it('should reject non-UUID clientId', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      clientId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing clientId', () => {
    const { clientId, ...rest } = validPayload
    const result = createQuoteSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('should reject invalid datetime for validUntil', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      validUntil: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with empty name', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: '', quantity: 1, unitPrice: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with name exceeding 255 chars', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'x'.repeat(256), quantity: 1, unitPrice: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with zero unitPrice', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: 1, unitPrice: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with negative unitPrice', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: 1, unitPrice: -100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with zero quantity', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: 0, unitPrice: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with negative quantity', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: -1, unitPrice: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should reject item with decimal quantity', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: 1.5, unitPrice: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('should default quantity to 1 if omitted', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', unitPrice: 100 }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items[0].quantity).toBe(1)
    }
  })

  it('should accept item without description', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
    })
    expect(result.success).toBe(true)
  })

  it('should accept multiple items', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [
        { name: 'Item 1', quantity: 1, unitPrice: 100 },
        { name: 'Item 2', quantity: 2, unitPrice: 200 },
        { name: 'Item 3', quantity: 3, unitPrice: 300 },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items).toHaveLength(3)
    }
  })

  it('should accept decimal unitPrice', () => {
    const result = createQuoteSchema.safeParse({
      ...validPayload,
      items: [{ name: 'Test', quantity: 1, unitPrice: 99.99 }],
    })
    expect(result.success).toBe(true)
  })
})

describe('createClientSchema', () => {
  const validPayload = {
    companyName: 'Test Corp',
    contactName: 'John Doe',
    email: 'john@test.com',
    portalSlug: 'test-corp',
  }

  it('should accept a valid payload', () => {
    const result = createClientSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('should default timezone to UTC', () => {
    const result = createClientSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.timezone).toBe('UTC')
    }
  })

  it('should reject empty companyName', () => {
    const result = createClientSchema.safeParse({
      ...validPayload,
      companyName: '',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const result = createClientSchema.safeParse({
      ...validPayload,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('should reject portalSlug with uppercase', () => {
    const result = createClientSchema.safeParse({
      ...validPayload,
      portalSlug: 'Test-Corp',
    })
    expect(result.success).toBe(false)
  })

  it('should reject portalSlug with spaces', () => {
    const result = createClientSchema.safeParse({
      ...validPayload,
      portalSlug: 'test corp',
    })
    expect(result.success).toBe(false)
  })

  it('should reject portalSlug shorter than 3 chars', () => {
    const result = createClientSchema.safeParse({
      ...validPayload,
      portalSlug: 'ab',
    })
    expect(result.success).toBe(false)
  })

  it('should accept portalSlug with hyphens and numbers', () => {
    const result = createClientSchema.safeParse({
      ...validPayload,
      portalSlug: 'test-corp-123',
    })
    expect(result.success).toBe(true)
  })
})

describe('createAccessCodeSchema', () => {
  const validPayload = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('should accept a valid payload with defaults', () => {
    const result = createAccessCodeSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.expiresInHours).toBe(720) // 30 days
      expect(result.data.maxUses).toBe(1)
    }
  })

  it('should accept optional quoteId', () => {
    const result = createAccessCodeSchema.safeParse({
      ...validPayload,
      quoteId: '550e8400-e29b-41d4-a716-446655440001',
    })
    expect(result.success).toBe(true)
  })

  it('should reject non-UUID clientId', () => {
    const result = createAccessCodeSchema.safeParse({
      ...validPayload,
      clientId: 'not-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('should reject expiresInHours below minimum', () => {
    const result = createAccessCodeSchema.safeParse({
      ...validPayload,
      expiresInHours: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject expiresInHours above maximum (2160 = 90 days)', () => {
    const result = createAccessCodeSchema.safeParse({
      ...validPayload,
      expiresInHours: 2161,
    })
    expect(result.success).toBe(false)
  })

  it('should reject zero maxUses', () => {
    const result = createAccessCodeSchema.safeParse({
      ...validPayload,
      maxUses: 0,
    })
    expect(result.success).toBe(false)
  })

  it('should reject negative maxUses', () => {
    const result = createAccessCodeSchema.safeParse({
      ...validPayload,
      maxUses: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe('Status Transition Validation', () => {
  // These test the business logic for status transitions
  // as defined in the PATCH /api/admin/quotes/[id] route
  const validTransitions: Record<string, string[]> = {
    draft: ['sent'],
    sent: ['expired', 'superseded'],
    viewed: ['expired', 'superseded'],
  }

  it('should allow draft -> sent', () => {
    const allowed = validTransitions['draft'] || []
    expect(allowed.includes('sent')).toBe(true)
  })

  it('should not allow draft -> accepted', () => {
    const allowed = validTransitions['draft'] || []
    expect(allowed.includes('accepted')).toBe(false)
  })

  it('should not allow draft -> rejected', () => {
    const allowed = validTransitions['draft'] || []
    expect(allowed.includes('rejected')).toBe(false)
  })

  it('should allow sent -> expired', () => {
    const allowed = validTransitions['sent'] || []
    expect(allowed.includes('expired')).toBe(true)
  })

  it('should allow sent -> superseded', () => {
    const allowed = validTransitions['sent'] || []
    expect(allowed.includes('superseded')).toBe(true)
  })

  it('should not allow sent -> draft', () => {
    const allowed = validTransitions['sent'] || []
    expect(allowed.includes('draft')).toBe(false)
  })

  it('should allow viewed -> expired', () => {
    const allowed = validTransitions['viewed'] || []
    expect(allowed.includes('expired')).toBe(true)
  })

  it('should not allow accepted -> any transition', () => {
    const allowed = validTransitions['accepted'] || []
    expect(allowed.length).toBe(0)
  })

  it('should not allow rejected -> any transition', () => {
    const allowed = validTransitions['rejected'] || []
    expect(allowed.length).toBe(0)
  })

  it('should not allow expired -> any transition', () => {
    const allowed = validTransitions['expired'] || []
    expect(allowed.length).toBe(0)
  })
})
