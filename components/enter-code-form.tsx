'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowRight } from 'lucide-react'
import { useVerifyCode } from '@/lib/query'

export function EnterCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const verifyCode = useVerifyCode()

  // #region agent log
  const debugLog = (msg: string, data: object) => {
    fetch('http://127.0.0.1:7244/ingest/bc5a1621-7775-44b9-baa7-befaa2e65fda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'enter-code-form.tsx',message:msg,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // #region agent log
    debugLog('handleSubmit called', { code, codeLength: code.length, isPending: verifyCode.isPending })
    // #endregion

    verifyCode.mutate(
      { code: code.toUpperCase().trim() },
      {
        onSuccess: (data) => {
          // #region agent log
          debugLog('verifyCode onSuccess', { data, redirect: data.redirect })
          // #endregion
          if (data.redirect) {
            router.push(data.redirect)
          }
        },
        // #region agent log
        onError: (error) => {
          debugLog('verifyCode onError', { error: error.message })
        },
        // #endregion
      }
    )
  }

  const error = verifyCode.error?.message ?? ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <label htmlFor="code" className="text-sm font-medium text-muted-foreground ml-1">
          ACCESS CODE
        </label>
        <div className="relative">
            <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => {
                const newCode = e.target.value.toUpperCase()
                // #region agent log
                debugLog('code onChange', { newCode, length: newCode.length, willDisable: newCode.length !== 8 })
                // #endregion
                setCode(newCode)
                verifyCode.reset()
            }}
            placeholder="XXX-XXX-XX"
            maxLength={8}
            className="text-center text-3xl h-16 tracking-[0.2em] font-mono uppercase bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-white/20"
            autoComplete="off"
            autoFocus
            disabled={verifyCode.isPending}
            />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-red-400 font-medium text-center">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 text-base font-bold text-black bg-primary hover:bg-primary/90 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(210,252,69,0.3)] hover:shadow-[0_0_30px_-5px_rgba(210,252,69,0.5)]"
        disabled={code.length !== 8 || verifyCode.isPending}
      >
        {verifyCode.isPending ? (
            <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                VERIFYING...
            </span>
        ) : (
            <span className="flex items-center gap-2">
                ACCESS PORTAL <ArrowRight className="w-4 h-4" />
            </span>
        )}
      </Button>
    </form>
  )
}
