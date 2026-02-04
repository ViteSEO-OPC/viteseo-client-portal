import { PrismaClient } from '@prisma/client'
import { encrypt } from '../lib/auth/encryption'

const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2]
  const email = process.argv[3]

  if (!slug || !email) {
    console.error('Usage: tsx scripts/rehash-client-email.ts <portalSlug> <email>')
    process.exit(1)
  }

  const encryptedEmail = encrypt(email)

  const updated = await prisma.client.update({
    where: { portalSlug: slug },
    data: { email: encryptedEmail },
  })

  console.log(`✅ Updated email encryption for ${updated.portalSlug}`)
}

main()
  .catch((error) => {
    console.error('Failed to update email encryption:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
