import { PrismaClient } from '@prisma/client'
import { hashOTP, getCodeHint } from '../lib/auth/otp'

const prisma = new PrismaClient()

async function main() {
  const clientSlug = process.argv[2] || 'rokid-philippines'
  const plainCode = process.argv[3] || 'ROKID2026'
  
  // Find the client
  const client = await prisma.client.findUnique({
    where: { portalSlug: clientSlug },
    include: { quotes: { take: 1, orderBy: { createdAt: 'desc' } } }
  })
  
  if (!client) {
    console.error(`Client not found: ${clientSlug}`)
    process.exit(1)
  }
  
  const quote = client.quotes[0]
  if (!quote) {
    console.error(`No quotes found for client: ${clientSlug}`)
    process.exit(1)
  }
  
  // Hash the code using Argon2id
  const codeHash = await hashOTP(plainCode)
  const codeHint = getCodeHint(plainCode)
  
  // Create access code
  const accessCode = await prisma.accessCode.create({
    data: {
      clientId: client.id,
      quoteId: quote.id,
      clientSlug: clientSlug,
      code: plainCode,
      codeHash: codeHash,
      codeHint: codeHint,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxUses: 100,
      isActive: true,
    }
  })
  
  console.log(`✅ Access code created!`)
  console.log(`   Client: ${client.companyName} (${clientSlug})`)
  console.log(`   Quote: ${quote.quoteNumber}`)
  console.log(`   Code: ${plainCode}`)
  console.log(`   Hint: ****${codeHint}`)
  console.log(`   Expires: ${accessCode.expiresAt?.toLocaleDateString()}`)
  console.log(`\n   Enter this code at: /enter-code`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
