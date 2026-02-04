import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/auth/encryption'
import { ClientEditForm } from './client-edit-form'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      quotes: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          quoteNumber: true,
          status: true,
          total: true,
          validUntil: true,
          createdAt: true,
        },
      },
      accessCodes: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          codeHint: true,
          expiresAt: true,
          usedCount: true,
          maxUses: true,
          revokedAt: true,
          createdAt: true,
        },
      },
      _count: {
        select: { quotes: true, accessCodes: true, sessions: true },
      },
    },
  })

  if (!client) {
    notFound()
  }

  return (
    <ClientEditForm
      client={{
        ...client,
        email: decrypt(client.email),
      }}
    />
  )
}
