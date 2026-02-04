'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'PDF-ERROR-BOUNDARY',location:'app/global-error.tsx',message:'global error boundary rendered',data:{pathname:typeof window !== 'undefined' ? window.location.pathname : 'unknown',errorName:error.name,digest:error.digest ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased font-body">
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-2xl font-bold font-heading text-white">Something went wrong</h1>
            <p className="text-muted-foreground">
              A critical error occurred. Please refresh the page.
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60 font-mono">Error ID: {error.digest}</p>
            )}
            <button
              onClick={reset}
              className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}