import type { Metadata } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const headingFont = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const bodyFont = Manrope({ 
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vite SEO Client Portal',
  description: 'Secure client quotation portal',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body className={`${headingFont.variable} ${bodyFont.variable} font-body bg-background text-foreground antialiased`}>
          <QueryProvider>{children}</QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
