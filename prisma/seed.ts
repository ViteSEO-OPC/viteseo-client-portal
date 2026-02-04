import { PrismaClient } from '@prisma/client'
import { encrypt } from '../lib/auth/encryption'
import { generateOTP, hashOTP, getCodeHint } from '../lib/auth/otp'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo client
  const client = await prisma.client.upsert({
    where: { portalSlug: 'demo-company' },
    update: {},
    create: {
      companyName: 'Demo Company Inc.',
      contactName: 'John Doe',
      email: encrypt('john.doe@example.com'),
      portalSlug: 'demo-company',
      timezone: 'Asia/Manila',
    },
  })

  console.log('Created client:', client.companyName)

  // Create demo quote
  const quote = await prisma.quote.upsert({
    where: { quoteNumber: 'Q-2026-0001' },
    update: {},
    create: {
      clientId: client.id,
      quoteNumber: 'Q-2026-0001',
      status: 'sent',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      total: 150000,
      currency: 'PHP',
      notes: 'Thank you for your business!',
      items: {
        create: [
          {
            name: 'SEO Audit & Strategy',
            description: 'Comprehensive SEO audit with actionable recommendations',
            quantity: 1,
            unitPrice: 50000,
            sortOrder: 1,
          },
          {
            name: 'Monthly SEO Management',
            description: 'Ongoing SEO optimization and reporting (3 months)',
            quantity: 3,
            unitPrice: 25000,
            sortOrder: 2,
          },
          {
            name: 'Content Writing',
            description: 'SEO-optimized blog posts (500-1000 words each)',
            quantity: 10,
            unitPrice: 2500,
            sortOrder: 3,
          },
        ],
      },
    },
  })

  console.log('Created quote:', quote.quoteNumber)

  // Generate demo access code
  const plainCode = generateOTP()
  const accessCode = await prisma.accessCode.create({
    data: {
      clientId: client.id,
      quoteId: quote.id,
      codeHash: await hashOTP(plainCode),
      codeHint: getCodeHint(plainCode),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      maxUses: 10,
    },
  })

  console.log('Created access code:', plainCode)
  console.log('Access code hint:', accessCode.codeHint)
  console.log('')
  console.log('=========================================')
  console.log('DEMO CREDENTIALS')
  console.log('=========================================')
  console.log(`Portal URL: http://localhost:3000/enter-code`)
  console.log(`Access Code: ${plainCode}`)
  console.log('=========================================')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
