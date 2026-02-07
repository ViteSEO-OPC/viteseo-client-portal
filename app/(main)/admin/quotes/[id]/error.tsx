'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function QuoteDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Quote detail error:', error)
  }, [error])

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-red-500/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Failed to load quote
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              An error occurred while loading this quote. It may have been deleted or you may not have permission.
            </p>
            <div className="flex gap-3">
              <Button onClick={reset}>Try again</Button>
              <Link href="/admin/quotes">
                <Button variant="outline">Back to Quotes</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
