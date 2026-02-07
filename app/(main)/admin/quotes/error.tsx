'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function QuotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Quotes page error:', error)
  }, [error])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-heading text-foreground">Quotes</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-red-500/10 p-4 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              An error occurred while loading quotes. Please try again.
            </p>
            <Button onClick={reset}>Try again</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
