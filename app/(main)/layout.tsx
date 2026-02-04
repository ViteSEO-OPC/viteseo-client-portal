import { ClerkProvider } from '@clerk/nextjs'
import { QueryProvider } from '@/components/providers/query-provider'

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <QueryProvider>{children}</QueryProvider>
    </ClerkProvider>
  )
}
