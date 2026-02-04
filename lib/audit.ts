import { prisma } from '@/lib/db'

export type AuditEventType =
  | 'OTP_VERIFIED'
  | 'OTP_FAILED'
  | 'OTP_LOCKED'
  | 'SESSION_CREATED'
  | 'SESSION_REVOKED'
  | 'QUOTE_VIEWED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'PDF_DOWNLOADED'
  | 'ACCESS_CODE_CREATED'
  | 'ACCESS_CODE_REVOKED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'QUOTE_CREATED'
  | 'QUOTE_UPDATED'
  | 'QUOTE_SENT'
  | 'QUOTE_SYNCED'
  | 'QUOTE_VERSIONED'
  | 'RATE_LIMIT_HIT'
  | 'CODE_VERIFIED'
  | 'CODE_INVALID'

export type ActorType = 'client' | 'admin' | 'system' | 'anonymous'

interface AuditLogParams {
  eventType: AuditEventType
  actorType: ActorType
  actorId?: string
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  meta?: Record<string, unknown>
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: params.eventType,
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        meta: params.meta,
      },
    })
  } catch (error) {
    // Log to console but don't fail the main operation
    console.error('Failed to create audit log:', error)
  }
}
