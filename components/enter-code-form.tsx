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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    verifyCode.mutate(
      { code: code.toUpperCase().trim() },
      {
        onSuccess: (data) => {
          if (data.redirect) {
            router.push(data.redirect)
          }
        },
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
                setCode(e.target.value.toUpperCase())
                verifyCode.reset()
            }}
            placeholder="XXX-XXX-XX"
            maxLength={8}
            className="text-center text-3xl h-16 tracking-[0.2em] font-mono uppercase bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all placeholder:text-white/10"
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
