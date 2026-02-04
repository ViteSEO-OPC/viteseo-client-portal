'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { usePathname } from 'next/navigation'
import { getQueryClient } from '@/lib/query/client'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient()
  const pathname = usePathname()

  // Hide devtools on PDF render routes to prevent them from appearing in generated PDFs
  const isPdfRenderRoute = pathname?.startsWith('/portal/pdf/render') ?? false
  const showDevtools = process.env.NODE_ENV === 'development' && !isPdfRenderRoute

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  )
}
