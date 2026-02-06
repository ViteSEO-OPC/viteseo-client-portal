import { z } from 'zod'

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .min(8, 'Access code must be 8 characters')
    .max(8, 'Access code must be 8 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Access code must be alphanumeric'),
})

export const createClientSchema = z.object({
  companyName: z.string().min(1).max(255),
  contactName: z.string().min(1).max(255),
  email: z.string().email().max(255),
  portalSlug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Portal slug must be lowercase alphanumeric with hyphens'),
  timezone: z.string().default('UTC'),
})

export const createQuoteSchema = z.object({
  clientId: z.string().uuid(),
  validUntil: z.string().datetime(),
  items: z.array(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      quantity: z.number().int().positive().default(1),
      unitPrice: z.number().positive(),
    })
  ).min(1),
})

export const createAccessCodeSchema = z.object({
  clientId: z.string().uuid(),
  quoteId: z.string().uuid().optional(),
  expiresInHours: z.number().int().min(1).max(2160).default(720), // 1 hour to 90 days
  maxUses: z.number().int().positive().default(1),
})

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type CreateAccessCodeInput = z.infer<typeof createAccessCodeSchema>
