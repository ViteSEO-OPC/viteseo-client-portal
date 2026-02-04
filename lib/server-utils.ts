import { createHash } from 'crypto'
import { headers } from 'next/headers'

/**
 * Server-only utilities that require next/headers
 * DO NOT import this file in client components
 */

export function calculateContentHash(content: object): string {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex')
}

export async function getClientIP(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIP = headersList.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return realIP || '127.0.0.1'
}

export async function getUserAgent(): Promise<string | undefined> {
  const headersList = await headers()
  return headersList.get('user-agent') || undefined
}
