import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params

  // Read client data to get active quote filename
  const clientDir = path.join(process.cwd(), 'clients', slug)
  const dataFile = path.join(clientDir, 'data.json')

  if (!fs.existsSync(dataFile)) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  let clientData
  try {
    const rawData = fs.readFileSync(dataFile, 'utf-8')
    clientData = JSON.parse(rawData)
  } catch {
    return NextResponse.json({ error: 'Invalid client data' }, { status: 500 })
  }

  if (!clientData.activeQuote) {
    return NextResponse.json({ error: 'No active quote' }, { status: 404 })
  }

  const pdfPath = path.join(clientDir, clientData.activeQuote)

  if (!fs.existsSync(pdfPath)) {
    return NextResponse.json({ error: 'Quote PDF not found' }, { status: 404 })
  }

  // Read and serve the PDF
  const pdfBuffer = fs.readFileSync(pdfPath)

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${clientData.activeQuote}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
