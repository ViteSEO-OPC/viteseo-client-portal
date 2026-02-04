'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'PDF-ERROR-BOUNDARY',location:'app/error.tsx',message:'error boundary rendered',data:{pathname:typeof window !== 'undefined' ? window.location.pathname : 'unknown',errorName:error.name,digest:error.digest ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [error])

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-6 max-w-md bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <div className="space-y-2">
            <h1 className="text-2xl font-bold font-heading text-white">Something went wrong</h1>
            <p className="text-muted-foreground">
            We apologize for the inconvenience. Please try again.
            </p>
        </div>
        
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">Error ID: {error.digest}</p>
        )}
        
        <Button onClick={reset} variant="outline" className="border-white/10 hover:bg-white/5">
            Try again
        </Button>
      </div>
    </main>
  )
}